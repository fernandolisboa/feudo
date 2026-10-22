import {
  buildCategorizationQueue,
  dashboardMonthRange,
  formatMoney,
  formatYearMonth,
  HOUSEHOLD_CURRENCY,
  summarizeUncategorized,
  yearMonthOf,
  type CategorySuggestion,
  type KindContext,
  type TransactionDirection,
} from "@feudo/core";

import { recordFinancialDataAccess } from "@/modules/audit";
import { formatIsoDate } from "@/lib/format-date";
import { interpolateAll } from "@/lib/interpolate";
import type { HouseholdSession } from "@/modules/households";
import { DEFAULT_TIME_ZONE, getHouseholdSettings, householdScope } from "@/modules/households";
import { getDb } from "@/platform/db/client";

import { createCategorizationRepository } from "./categorization-repository";
import type { SubcategoryOptionGroup } from "./components/categorize-transaction-dialog";
import { householdHasAccounts, readHouseholdDashboardLines } from "./dashboard-lines";
import type { ResolvedLedgerRow } from "./resolve-ledger-rows";
import { encodeSubcategoryRef } from "./subcategory-ref";
import { t } from "./strings";
import { buildTaxonomyView, type TaxonomyView } from "./taxonomy-view";

export type GuidedSuggestionView = { value: string; label: string; reason: string };

export type GuidedItemView = {
  id: string;
  description: string;
  dateLabel: string;
  accountLabel: string;
  amountLabel: string;
  type: TransactionDirection;
  pattern: string;
  similarCount: number;
  suggestion: GuidedSuggestionView | null;
  deferred: boolean;
};

export type GuidedCategorizationProps = {
  sinceLabel: string;
  hasAccounts: boolean;
  items: GuidedItemView[];
  categoryGroups: SubcategoryOptionGroup[];
};

export type CategorizationNudgeProps = { count: number; amountLabel: string; sinceLabel: string };

type UncategorizedWindow = {
  sinceLabel: string;
  kinds: KindContext;
  rows: ResolvedLedgerRow[];
};

// The same window and currency as the overview's numbers (dashboardMonthRange
// through readHouseholdDashboardLines, household currency only per
// ADR-0002): what is uncategorized here is exactly what keeps Visão geral and
// the reserve target incomplete. A foreign-currency row is in no number, so
// counting it would claim an incompleteness that categorizing cannot fix.
async function readUncategorizedWindow(
  session: HouseholdSession,
  now: Date,
): Promise<UncategorizedWindow> {
  const db = getDb();
  const scope = householdScope(session);
  const settings = await getHouseholdSettings(scope, db);
  const timeZone = settings?.timeZone ?? DEFAULT_TIME_ZONE;
  const month = yearMonthOf(now, timeZone);
  const { kinds, rows } = await readHouseholdDashboardLines(db, scope, month, timeZone);
  return {
    sinceLabel: formatYearMonth(dashboardMonthRange(month).from),
    kinds,
    rows: rows.filter((row) => row.currency === HOUSEHOLD_CURRENCY),
  };
}

function suggestionReason(suggestion: CategorySuggestion, target: string): string {
  switch (suggestion.reason) {
    case "history":
      return interpolateAll(
        suggestion.matches === 1 ? t.guided.suggestion.historyOne : t.guided.suggestion.historyMany,
        { count: String(suggestion.matches), target },
      );
    case "credit":
      return t.guided.suggestion.credit;
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
  };
}

// Everything /categorizar renders: the uncategorized transactions of the
// overview's window, largest first, each with a suggestion drawn only from
// the household's own categorized history (packages/core, no AI call), and
// whether the household put it off for later. The audit write (ADR-0008)
// happens only after the read succeeds.
export async function getGuidedCategorizationProps(
  session: HouseholdSession,
  now: Date = new Date(),
): Promise<GuidedCategorizationProps> {
  const [{ sinceLabel, kinds, rows }, hasAccounts, deferredIds] = await Promise.all([
    readUncategorizedWindow(session, now),
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
      date: row.date,
      categorization: row.categorization,
    })),
  );

  const props: GuidedCategorizationProps = {
    sinceLabel,
    hasAccounts,
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
          similarCount: item.similarCount,
          suggestion: suggestionView(item.suggestion, taxonomy),
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
  const { sinceLabel, rows } = await readUncategorizedWindow(session, now);
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
