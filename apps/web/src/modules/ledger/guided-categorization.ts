import {
  buildCategorizationQueue,
  dashboardMonthRange,
  formatMoney,
  formatYearMonth,
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

import type { SubcategoryOptionGroup } from "./components/categorize-transaction-dialog";
import { readHouseholdDashboardLines } from "./dashboard-lines";
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
};

export type GuidedCategorizationProps = {
  sinceLabel: string;
  hasTransactions: boolean;
  items: GuidedItemView[];
  categoryGroups: SubcategoryOptionGroup[];
};

export type CategorizationNudgeProps = { count: number; amountLabel: string; sinceLabel: string };

type UncategorizedWindow = {
  sinceLabel: string;
  kinds: KindContext;
  rows: ResolvedLedgerRow[];
};

// The same window as the overview's numbers (dashboardMonthRange through
// readHouseholdDashboardLines): what is uncategorized here is exactly what
// keeps Visão geral and the reserve target incomplete.
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
  return { sinceLabel: formatYearMonth(dashboardMonthRange(month).from), kinds, rows };
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
// the household's own categorized history (packages/core, no AI call). The
// audit write (ADR-0008) happens only after the read succeeds.
export async function getGuidedCategorizationProps(
  session: HouseholdSession,
  now: Date = new Date(),
): Promise<GuidedCategorizationProps> {
  const { sinceLabel, kinds, rows } = await readUncategorizedWindow(session, now);
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
    hasTransactions: rows.length > 0,
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
