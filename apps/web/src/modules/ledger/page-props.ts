import {
  formatMoney,
  formatYearMonth,
  rulePatternFromDescription,
  shiftYearMonth,
  summarizeLedger,
  summarizeUncategorized,
  yearMonthDayRange,
  yearMonthOf,
  type CurrencyAmount,
  type InternalTransfer,
  type YearMonth,
} from "@feudo/core";

import { formatIsoDate } from "@/lib/format-date";
import { interpolateAll } from "@/lib/interpolate";
import { getDb } from "@/platform/db/client";
import type { HouseholdSession } from "@/modules/households";
import { DEFAULT_TIME_ZONE, getHouseholdSettings, householdScope } from "@/modules/households";

import type { SubcategoryOptionGroup } from "./components/categorize-transaction-dialog";
import type { TransactionRowView } from "./components/transactions-table";
import { readHouseholdLedger } from "./ledger-read";
import {
  createHouseholdLedgerRepository,
  type LedgerAccount,
  type LedgerTransactionRow,
} from "./repository";
import type { ResolvedLedgerRow } from "./resolve-ledger-rows";
import { encodeSubcategoryRef } from "./subcategory-ref";
import { t } from "./strings";
import { buildTaxonomyView, type TaxonomyView } from "./taxonomy-view";
import {
  TRANSACTIONS_PAGE_SIZE,
  transactionsSearchParamsSchema,
  type TransactionsSearchParams,
} from "./validation";

const FALLBACK_CURRENCY = "BRL";

export type UncategorizedSummaryView = { count: number; amountLabel: string };

export type TotalsView = { incomeLabel: string; spendingLabel: string; transferCount: number };

export type TransactionsPageProps = {
  month: YearMonth;
  monthLabel: string;
  previousMonth: YearMonth;
  nextMonth: YearMonth | null;
  accounts: LedgerAccount[];
  selectedAccountId: string | null;
  uncategorizedOnly: boolean;
  uncategorized: UncategorizedSummaryView;
  totals: TotalsView;
  categoryGroups: SubcategoryOptionGroup[];
  transactions: TransactionRowView[];
  total: number;
  page: number;
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
  return currencies[0] ?? FALLBACK_CURRENCY;
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
// slice's components (ADR-0011). The month defaults to today's in the
// household's time zone; an account id not in the household is ignored and
// a page past the last one lands on the last. Pairing and categorization
// are both resolved by readHouseholdLedger, the one read path shared with
// /categorias (design contract's #16 review, item 3).
export async function getTransactionsPageProps(
  session: HouseholdSession,
  searchParams: TransactionsSearchParams,
  now: Date = new Date(),
): Promise<TransactionsPageProps> {
  const db = getDb();
  const scope = householdScope(session);
  const repository = createHouseholdLedgerRepository(scope);
  const params = transactionsSearchParamsSchema.parse(searchParams);

  const [settings, accounts] = await Promise.all([
    getHouseholdSettings(scope, db),
    repository.listAccounts(db),
  ]);
  const currentMonth = yearMonthOf(now, settings?.timeZone ?? DEFAULT_TIME_ZONE);
  const month = params.mes ?? currentMonth;
  const selectedAccountId = accounts.some((account) => account.id === params.conta)
    ? (params.conta ?? null)
    : null;
  const uncategorizedOnly = params.categoria !== undefined;

  const monthRange = yearMonthDayRange(month);
  const {
    kinds,
    rows: monthRows,
    padded,
  } = await readHouseholdLedger(db, scope, monthRange, selectedAccountId);
  const taxonomy = buildTaxonomyView(kinds);
  const rowById = new Map(padded.map((row) => [row.id, row]));

  const summary = summarizeUncategorized(
    monthRows.map((row) => ({
      categorization: row.categorization,
      amount: { amountCentavos: row.amountCentavos, currency: row.currency },
    })),
  );
  const totals = summarizeLedger(
    monthRows.map((row) => ({
      kind: row.kind,
      type: row.type,
      amount: { amountCentavos: row.amountCentavos, currency: row.currency },
    })),
  );
  const listed = uncategorizedOnly
    ? monthRows.filter((row) => row.categorization === null)
    : monthRows;
  const total = listed.length;
  const lastPage = Math.max(1, Math.ceil(total / TRANSACTIONS_PAGE_SIZE));
  const page = Math.min(params.pagina ?? 1, lastPage);
  const start = (page - 1) * TRANSACTIONS_PAGE_SIZE;
  const totalsCurrency = fallbackCurrency(monthRows);

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
    hasMore: start + TRANSACTIONS_PAGE_SIZE < total,
  };
}
