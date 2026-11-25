import {
  batchForAiSuggestion,
  buildCategorizationQueue,
  formatMoney,
  summarizeUncategorized,
  type CategorySuggestion,
  type SubcategoryRef,
  type TransactionDirection,
} from "@feudo/core";

import { recordFinancialDataAccess } from "@/modules/audit";
import { formatIsoDate } from "@/lib/format-date";
import { interpolateAll } from "@/lib/interpolate";
import type { HouseholdSession } from "@/modules/households";
import { householdScope } from "@/modules/households";
import { getDb } from "@/platform/db/client";

import { aiBatchRowsFor } from "./ai-suggestion-candidates";
import { createCategorizationRepository } from "./categorization-repository";
import { readCategorizationWindow } from "./categorization-window";
import type { SubcategoryOptionGroup } from "./components/categorize-transaction-dialog";
import { householdHasAccounts } from "./dashboard-lines";
import { ruleAmountLabel } from "./rule-amount-label";
import { encodeSubcategoryRef } from "./subcategory-ref";
import { t } from "./strings";
import { buildTaxonomyView, type TaxonomyView } from "./taxonomy-view";

export type GuidedSuggestionSource = "history" | "ai" | "credit";

export type GuidedSuggestionView = {
  value: string;
  label: string;
  reason: string;
  source: GuidedSuggestionSource;
};

export type GuidedItemView = {
  id: string;
  description: string;
  dateLabel: string;
  accountLabel: string;
  amountLabel: string;
  type: TransactionDirection;
  pattern: string;
  ruleAmountLabel: string | null;
  sameAmountCount: number;
  similarCount: number;
  suggestion: GuidedSuggestionView | null;
  noSuggestionReason: string;
  deferred: boolean;
};

export type GuidedCategorizationProps = {
  sinceLabel: string;
  hasAccounts: boolean;
  items: GuidedItemView[];
  categoryGroups: SubcategoryOptionGroup[];
  aiPendingCount: number;
};

export type CategorizationNudgeProps = { count: number; amountLabel: string; sinceLabel: string };

function suggestionReason(suggestion: CategorySuggestion, target: string): string {
  switch (suggestion.reason) {
    case "history_amount":
      return interpolateAll(
        suggestion.matches === 1
          ? t.guided.suggestion.historyAmountOne
          : t.guided.suggestion.historyAmountMany,
        { count: String(suggestion.matches), target },
      );
    case "history":
      return interpolateAll(
        suggestion.matches === 1 ? t.guided.suggestion.historyOne : t.guided.suggestion.historyMany,
        { count: String(suggestion.matches), target },
      );
    case "ai":
      return t.guided.suggestion.ai;
    case "credit":
      return t.guided.suggestion.credit;
  }
}

function suggestionSource(reason: CategorySuggestion["reason"]): GuidedSuggestionSource {
  switch (reason) {
    case "history_amount":
    case "history":
      return "history";
    case "ai":
      return "ai";
    case "credit":
      return "credit";
  }
}

function suggestionView(
  suggestion: CategorySuggestion | null,
  taxonomy: TaxonomyView,
): GuidedSuggestionView | null {
  if (suggestion === null) {
    return null;
  }
  const label = taxonomy.labelOf(suggestion.subcategory);
  if (label === null) {
    return null;
  }
  const target = `${label.categoryLabel} · ${label.label}`;
  return {
    value: encodeSubcategoryRef(suggestion.subcategory),
    label: target,
    reason: suggestionReason(suggestion, target),
    source: suggestionSource(suggestion.reason),
  };
}

export type GuidedCategorizationOptions = {
  aiSuggestions: ReadonlyMap<string, SubcategoryRef | null>;
};

const NO_AI_SUGGESTIONS: GuidedCategorizationOptions = { aiSuggestions: new Map() };

// Everything /categorizar renders: the uncategorized transactions of the
// overview's window, largest first, each with a suggestion drawn from the
// household's own categorized history first and, with nothing from history,
// a stored AI suggestion when the household asked for one (ADR-0014). The
// audit write (ADR-0008) happens only after the read succeeds.
export async function getGuidedCategorizationProps(
  session: HouseholdSession,
  now: Date = new Date(),
  options: GuidedCategorizationOptions = NO_AI_SUGGESTIONS,
): Promise<GuidedCategorizationProps> {
  const [{ sinceLabel, kinds, rows }, hasAccounts, deferredIds] = await Promise.all([
    readCategorizationWindow(session, now),
    householdHasAccounts(getDb(), householdScope(session)),
    createCategorizationRepository(householdScope(session)).listDeferredTransactionIds(getDb()),
  ]);
  const taxonomy = buildTaxonomyView(kinds);
  const rowById = new Map(rows.map((row) => [row.id, row]));

  const queue = buildCategorizationQueue(
    rows.map((row) => ({
      id: row.id,
      description: row.description,
      type: row.type,
      amountCentavos: row.amountCentavos,
      currency: row.currency,
      date: row.date,
      categorization: row.categorization,
      aiSuggestion: options.aiSuggestions.get(row.id),
    })),
  );
  const aiPendingGroups = batchForAiSuggestion(
    aiBatchRowsFor(rows),
    new Set(options.aiSuggestions.keys()),
    Number.POSITIVE_INFINITY,
  );

  const props: GuidedCategorizationProps = {
    sinceLabel,
    hasAccounts,
    aiPendingCount: aiPendingGroups.reduce((sum, group) => sum + group.transactionIds.length, 0),
    items: queue.flatMap((item): GuidedItemView[] => {
      const row = rowById.get(item.id);
      if (!row) {
        return [];
      }
      return [
        {
          id: row.id,
          description: row.description,
          dateLabel: formatIsoDate(row.date),
          accountLabel: `${row.institutionName} · ${row.accountName}`,
          amountLabel: formatMoney({ amountCentavos: row.amountCentavos, currency: row.currency }),
          type: row.type,
          pattern: item.pattern,
          ruleAmountLabel: ruleAmountLabel(row),
          sameAmountCount: item.sameAmountCount,
          similarCount: item.similarCount,
          suggestion: suggestionView(item.suggestion, taxonomy),
          noSuggestionReason: item.conflictingHistory
            ? t.guided.suggestion.conflicting
            : t.guided.suggestion.none,
          deferred: deferredIds.has(row.id),
        },
      ];
    }),
    categoryGroups: taxonomy.categories.map((category) => ({
      label: category.label,
      options: category.subcategories.map(({ value, label }) => ({ value, label })),
    })),
  };
  await recordFinancialDataAccess(session, "transactions");
  return props;
}

// The app-wide notice, on every screen of the signed-in shell. Its count and
// amount are financial data, so showing them is recorded (ADR-0008); when
// nothing is uncategorized the notice shows nothing and records nothing, or
// every screen would log a transactions access nobody saw.
export async function getCategorizationNudgeProps(
  session: HouseholdSession,
  now: Date = new Date(),
): Promise<CategorizationNudgeProps | null> {
  const { sinceLabel, rows } = await readCategorizationWindow(session, now);
  const summary = summarizeUncategorized(
    rows.map((row) => ({
      categorization: row.categorization,
      amount: { amountCentavos: row.amountCentavos, currency: row.currency },
    })),
  );
  if (summary.count === 0) {
    return null;
  }
  await recordFinancialDataAccess(session, "transactions");
  return {
    count: summary.count,
    amountLabel: summary.totals.map(formatMoney).join(" + "),
    sinceLabel,
  };
}
