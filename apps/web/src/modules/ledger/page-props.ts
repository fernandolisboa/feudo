import {
  formatMoney,
  formatYearMonth,
  rulePatternFromDescription,
  shiftYearMonth,
  summarizeUncategorized,
  yearMonthDayRange,
  yearMonthOf,
  type YearMonth,
} from "@feudo/core";

import { getDb } from "@/platform/db/client";
import type { HouseholdSession } from "@/modules/households";
import { DEFAULT_TIME_ZONE, getHouseholdSettings, householdScope } from "@/modules/households";

import { categorizeRows, type CategorizedRow } from "./categorize-rows";
import { createCategorizationRepository } from "./categorization-repository";
import type { SubcategoryOptionGroup } from "./components/categorize-transaction-dialog";
import type { TransactionRowView } from "./components/transactions-table";
import { createHouseholdLedgerRepository, type LedgerAccount } from "./repository";
import { encodeSubcategoryRef } from "./subcategory-ref";
import { t } from "./strings";
import { buildTaxonomyView, type TaxonomyView } from "./taxonomy-view";
import {
  TRANSACTIONS_PAGE_SIZE,
  transactionsSearchParamsSchema,
  type TransactionsSearchParams,
} from "./validation";

export type UncategorizedSummaryView = { count: number; amountLabel: string };

export type TransactionsPageProps = {
  month: YearMonth;
  monthLabel: string;
  previousMonth: YearMonth;
  nextMonth: YearMonth | null;
  accounts: LedgerAccount[];
  selectedAccountId: string | null;
  uncategorizedOnly: boolean;
  uncategorized: UncategorizedSummaryView;
  categoryGroups: SubcategoryOptionGroup[];
  transactions: TransactionRowView[];
  total: number;
  page: number;
  hasMore: boolean;
};

function toRowView(row: CategorizedRow, taxonomy: TaxonomyView): TransactionRowView {
  const label = row.categorization ? taxonomy.labelOf(row.categorization.subcategory) : null;
  const amountLabel = formatMoney({ amountCentavos: row.amountCentavos, currency: row.currency });
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    amountCentavos: row.amountCentavos,
    currency: row.currency,
    accountName: row.accountName,
    institutionName: row.institutionName,
    category:
      row.categorization && label
        ? {
            label: label.label,
            categoryLabel: label.categoryLabel,
            sourceLabel: t.category.sources[row.categorization.source],
          }
        : null,
    categorize: {
      id: row.id,
      description: row.description,
      amountLabel,
      type: row.type,
      subcategoryValue:
        row.categorization && label ? encodeSubcategoryRef(row.categorization.subcategory) : null,
      isManual: row.manual !== null,
      suggestedPattern: rulePatternFromDescription(row.description),
    },
  };
}

// Everything /transacoes renders, so the page stays a composition of this
// slice's components (ADR-0011). The month defaults to today's in the
// household's time zone; an account id not in the household is ignored and
// a page past the last one lands on the last. Categories are resolved here,
// over the whole month, because the uncategorized count and the filter need
// every row, not just the page on screen (ADR-0003, amended 2026-09-26).
export async function getTransactionsPageProps(
  session: HouseholdSession,
  searchParams: TransactionsSearchParams,
  now: Date = new Date(),
): Promise<TransactionsPageProps> {
  const db = getDb();
  const scope = householdScope(session);
  const repository = createHouseholdLedgerRepository(scope);
  const categorization = createCategorizationRepository(scope);
  const params = transactionsSearchParamsSchema.parse(searchParams);

  const [settings, accounts, householdSubcategories, overrides, rules] = await Promise.all([
    getHouseholdSettings(scope, db),
    repository.listAccounts(db),
    categorization.listHouseholdSubcategories(db),
    categorization.listKindOverrides(db),
    categorization.listRules(db),
  ]);
  const currentMonth = yearMonthOf(now, settings?.timeZone ?? DEFAULT_TIME_ZONE);
  const month = params.mes ?? currentMonth;
  const selectedAccountId = accounts.some((account) => account.id === params.conta)
    ? (params.conta ?? null)
    : null;
  const uncategorizedOnly = params.categoria !== undefined;
  const taxonomy = buildTaxonomyView({
    overrides,
    householdSubcategories: new Map(
      householdSubcategories.map((subcategory) => [subcategory.id, subcategory]),
    ),
  });

  const rows = categorizeRows(
    await repository.listTransactionsInRange(db, {
      days: yearMonthDayRange(month),
      accountId: selectedAccountId,
    }),
    rules,
  );
  const summary = summarizeUncategorized(
    rows.map((row) => ({
      categorization: row.categorization,
      amount: { amountCentavos: row.amountCentavos, currency: row.currency },
    })),
  );
  const listed = uncategorizedOnly ? rows.filter((row) => row.categorization === null) : rows;
  const total = listed.length;
  const lastPage = Math.max(1, Math.ceil(total / TRANSACTIONS_PAGE_SIZE));
  const page = Math.min(params.pagina ?? 1, lastPage);
  const start = (page - 1) * TRANSACTIONS_PAGE_SIZE;

  return {
    month,
    monthLabel: formatYearMonth(month),
    previousMonth: shiftYearMonth(month, -1),
    nextMonth: month < currentMonth ? shiftYearMonth(month, 1) : null,
    accounts,
    selectedAccountId,
    uncategorizedOnly,
    uncategorized: {
      count: summary.count,
      amountLabel: summary.totals.map(formatMoney).join(" + "),
    },
    categoryGroups: taxonomy.categories.map((category) => ({
      label: category.label,
      options: category.subcategories.map(({ value, label }) => ({ value, label })),
    })),
    transactions: listed
      .slice(start, start + TRANSACTIONS_PAGE_SIZE)
      .map((row) => toRowView(row, taxonomy)),
    total,
    page,
    hasMore: start + TRANSACTIONS_PAGE_SIZE < total,
  };
}
