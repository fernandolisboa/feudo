import {
  formatMoney,
  formatYearMonth,
  HOUSEHOLD_CURRENCY,
  rulePatternFromDescription,
  shiftYearMonth,
  summarizeLedger,
  summarizeUncategorized,
  type CurrencyAmount,
  type InternalTransfer,
  type IsoDateRange,
  type Kind,
  type ProductCategoryId,
  type YearMonth,
} from "@feudo/core";

import { recordFinancialDataAccess } from "@/modules/audit";
import { formatIsoDate } from "@/lib/format-date";
import { interpolateAll } from "@/lib/interpolate";
import type { HouseholdSession } from "@/modules/households";

import type { SubcategoryOptionGroup } from "./components/categorize-transaction-dialog";
import type { TransactionRowView } from "./components/transactions-table";
import type { LedgerAccount, LedgerTransactionRow } from "./repository";
import type { ResolvedLedgerRow } from "./resolve-ledger-rows";
import { encodeSubcategoryRef } from "./subcategory-ref";
import { t } from "./strings";
import { buildTaxonomyView, type TaxonomyView } from "./taxonomy-view";
import { readFilteredTransactions } from "./transactions-read";
import { TRANSACTIONS_PAGE_SIZE, type TransactionsSearchParams } from "./validation";

export type UncategorizedSummaryView = { count: number; amountLabel: string };

export type TotalsView = { incomeLabel: string; spendingLabel: string; transferCount: number };

export type CategoryFilterOption = { id: ProductCategoryId; label: string };

export type TransactionsPageProps = {
  month: YearMonth;
  monthLabel: string;
  previousMonth: YearMonth;
  nextMonth: YearMonth | null;
  range: IsoDateRange | null;
  periodLabel: string | null;
  todayIso: string;
  accounts: LedgerAccount[];
  selectedAccountId: string | null;
  uncategorizedOnly: boolean;
  selectedCategory: ProductCategoryId | null;
  categoryFilterOptions: CategoryFilterOption[];
  selectedKind: Kind | null;
  searchQuery: string | null;
  monthHasTransactions: boolean;
  uncategorized: UncategorizedSummaryView;
  totals: TotalsView;
  categoryGroups: SubcategoryOptionGroup[];
  transactions: TransactionRowView[];
  total: number;
  page: number;
  pageCount: number;
  hasMore: boolean;
};

// A total with nothing in it still reads as a full sentence rather than an
// empty string: it shows zero in whatever currency the rows the totals are
// computed over actually use (the month's rows for the selected account, not
// the page's uncategorized-filtered list, design contract's #16 review round
// 2 item 8), so a household that only ever sees USD accounts doesn't get a
// stray "R$ 0,00", and only falls back to BRL when there is nothing to take
// a currency from.
function fallbackCurrency(rows: readonly { currency: string }[]): string {
  const currencies = [...new Set(rows.map((row) => row.currency))].sort((a, b) =>
    a.localeCompare(b),
  );
  return currencies[0] ?? HOUSEHOLD_CURRENCY;
}

function amountsLabel(amounts: readonly CurrencyAmount[], currency: string): string {
  if (amounts.length === 0) {
    return formatMoney({ amountCentavos: 0, currency });
  }
  return amounts.map(formatMoney).join(" + ");
}

function pairTooltip(counterpart: LedgerTransactionRow): string {
  return interpolateAll(t.category.transferTooltip.pair, {
    institution: counterpart.institutionName,
    account: counterpart.accountName,
    date: formatIsoDate(counterpart.date),
  });
}

function transferTooltip(
  internalTransfer: InternalTransfer,
  rowById: ReadonlyMap<string, LedgerTransactionRow>,
): string {
  if (internalTransfer.source === "mark") {
    return t.category.transferTooltip.mark;
  }
  const counterpart = rowById.get(internalTransfer.counterpartId);
  return counterpart ? pairTooltip(counterpart) : t.category.sources.internal_transfer;
}

function toRowView(
  row: ResolvedLedgerRow,
  taxonomy: TaxonomyView,
  rowById: ReadonlyMap<string, LedgerTransactionRow>,
): TransactionRowView {
  const label = row.categorization ? taxonomy.labelOf(row.categorization.subcategory) : null;
  const amountLabel = formatMoney({ amountCentavos: row.amountCentavos, currency: row.currency });
  const sourceLabel = row.internalTransfer
    ? transferTooltip(row.internalTransfer, rowById)
    : row.categorization
      ? t.category.sources[row.categorization.source]
      : null;
  const manualLabel = row.manual ? taxonomy.labelOf(row.manual) : null;
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    amountCentavos: row.amountCentavos,
    currency: row.currency,
    accountName: row.accountName,
    institutionName: row.institutionName,
    category:
      row.categorization && label && sourceLabel
        ? { label: label.label, categoryLabel: label.categoryLabel, sourceLabel }
        : null,
    categorize: {
      id: row.id,
      description: row.description,
      amountLabel,
      type: row.type,
      // The manual choice a member stored always wins the prefill, so saving
      // the dialog again never overwrites it with a derived transfer
      // subcategory (design contract's #16 review, item 9).
      subcategoryValue:
        row.manual && manualLabel
          ? encodeSubcategoryRef(row.manual)
          : row.categorization && label
            ? encodeSubcategoryRef(row.categorization.subcategory)
            : null,
      isManual: row.manual !== null,
      isInternalTransfer: row.internalTransfer !== null,
      hasTransferMark: row.transferMark !== null,
      suggestedPattern: rulePatternFromDescription(row.description),
    },
  };
}

// Everything /transacoes renders, so the page stays a composition of this
// slice's components (ADR-0011). The URL is read by readFilteredTransactions
// (month clamp, account and filters); a page past the last one lands on the
// last. Pairing and
// categorization are both resolved by readHouseholdLedger, the one read
// path shared with /categorias (design contract's #16 review, item 3). The
// audit write (ADR-0008, amended 2026-10-03 #27) happens only after the
// read below succeeds, not concurrently with it: a failed read records
// nothing, and a failed write still fails this call.
export async function getTransactionsPageProps(
  session: HouseholdSession,
  searchParams: TransactionsSearchParams,
  now: Date = new Date(),
): Promise<TransactionsPageProps> {
  const props = await buildTransactionsPageProps(session, searchParams, now);
  await recordFinancialDataAccess(session, "transactions");
  return props;
}

async function buildTransactionsPageProps(
  session: HouseholdSession,
  searchParams: TransactionsSearchParams,
  now: Date,
): Promise<TransactionsPageProps> {
  const {
    currentMonth,
    month,
    range,
    todayIso,
    accounts,
    selectedAccountId,
    uncategorizedOnly,
    selectedCategory,
    selectedKind,
    searchQuery,
    requestedPage,
    kinds,
    monthRows,
    padded,
    filteredRows,
    listed,
  } = await readFilteredTransactions(session, searchParams, now);
  const taxonomy = buildTaxonomyView(kinds);
  const rowById = new Map(padded.map((row) => [row.id, row]));

  const summary = summarizeUncategorized(
    monthRows.map((row) => ({
      categorization: row.categorization,
      amount: { amountCentavos: row.amountCentavos, currency: row.currency },
    })),
  );
  const totals = summarizeLedger(
    filteredRows.map((row) => ({
      kind: row.kind,
      type: row.type,
      amount: { amountCentavos: row.amountCentavos, currency: row.currency },
    })),
  );
  const total = listed.length;
  const lastPage = Math.max(1, Math.ceil(total / TRANSACTIONS_PAGE_SIZE));
  const page = Math.min(requestedPage, lastPage);
  const start = (page - 1) * TRANSACTIONS_PAGE_SIZE;
  const totalsCurrency = fallbackCurrency(monthRows);
  const periodLabel = range
    ? interpolateAll(t.period.rangeLabel, {
        from: formatIsoDate(range.from),
        to: formatIsoDate(range.to),
      })
    : null;

  return {
    month,
    monthLabel: formatYearMonth(month),
    previousMonth: shiftYearMonth(month, -1),
    nextMonth: month < currentMonth ? shiftYearMonth(month, 1) : null,
    range,
    periodLabel,
    todayIso,
    accounts,
    selectedAccountId,
    uncategorizedOnly,
    selectedCategory,
    categoryFilterOptions: taxonomy.categories.map((category) => ({
      id: category.categoryId,
      label: category.label,
    })),
    selectedKind,
    searchQuery,
    monthHasTransactions: monthRows.length > 0,
    uncategorized: {
      count: summary.count,
      amountLabel: summary.totals.map(formatMoney).join(" + "),
    },
    totals: {
      incomeLabel: amountsLabel(totals.income, totalsCurrency),
      spendingLabel: amountsLabel(totals.spending, totalsCurrency),
      transferCount: totals.transferCount,
    },
    categoryGroups: taxonomy.categories.map((category) => ({
      label: category.label,
      options: category.subcategories.map(({ value, label }) => ({ value, label })),
    })),
    transactions: listed
      .slice(start, start + TRANSACTIONS_PAGE_SIZE)
      .map((row) => toRowView(row, taxonomy, rowById)),
    total,
    page,
    pageCount: lastPage,
    hasMore: start + TRANSACTIONS_PAGE_SIZE < total,
  };
}
