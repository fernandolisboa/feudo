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
  type KindContext,
  type LedgerContext,
  type YearMonth,
} from "@feudo/core";

import { formatIsoDate } from "@/lib/format-date";
import { interpolate } from "@/lib/interpolate";
import { getDb } from "@/platform/db/client";
import type { HouseholdSession } from "@/modules/households";
import { DEFAULT_TIME_ZONE, getHouseholdSettings, householdScope } from "@/modules/households";

import { resolveLedgerRows, type ResolvedLedgerRow } from "./categorize-rows";
import { createCategorizationRepository } from "./categorization-repository";
import type { SubcategoryOptionGroup } from "./components/categorize-transaction-dialog";
import type { TransactionRowView } from "./components/transactions-table";
import { PAIRING_WINDOW_PAD_DAYS, padDayRange } from "./pairing-window";
import {
  createHouseholdLedgerRepository,
  type LedgerAccount,
  type LedgerTransactionRow,
} from "./repository";
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

// Falls back to a zero amount in the household's usual currency rather than
// an empty string, so the totals line always reads as a full sentence even
// in a month with no income, or no spending, at all.
function amountsLabel(amounts: readonly CurrencyAmount[]): string {
  if (amounts.length === 0) {
    return formatMoney({ amountCentavos: 0, currency: FALLBACK_CURRENCY });
  }
  return amounts.map(formatMoney).join(" + ");
}

function pairTooltip(counterpart: LedgerTransactionRow): string {
  return interpolate(
    interpolate(
      interpolate(t.category.transferTooltip.pair, "{institution}", counterpart.institutionName),
      "{account}",
      counterpart.accountName,
    ),
    "{date}",
    formatIsoDate(counterpart.date),
  );
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
      subcategoryValue:
        row.categorization && label ? encodeSubcategoryRef(row.categorization.subcategory) : null,
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
// a page past the last one lands on the last. Pairing and categorization are
// both resolved here, over the whole household padded a week past the
// month's edges (design contract #16), because a pair's other leg can fall
// just outside the month being viewed; the month/account filter is applied
// only after resolving, never to the query that feeds it.
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

  const [settings, accounts, householdSubcategories, overrides, rules, holderDocumentHashes] =
    await Promise.all([
      getHouseholdSettings(scope, db),
      repository.listAccounts(db),
      categorization.listHouseholdSubcategories(db),
      categorization.listKindOverrides(db),
      categorization.listRules(db),
      repository.listHolderDocumentHashes(db),
    ]);
  const currentMonth = yearMonthOf(now, settings?.timeZone ?? DEFAULT_TIME_ZONE);
  const month = params.mes ?? currentMonth;
  const selectedAccountId = accounts.some((account) => account.id === params.conta)
    ? (params.conta ?? null)
    : null;
  const uncategorizedOnly = params.categoria !== undefined;
  const kinds: KindContext = {
    overrides,
    householdSubcategories: new Map(
      householdSubcategories.map((subcategory) => [subcategory.id, subcategory]),
    ),
  };
  const taxonomy = buildTaxonomyView(kinds);

  const monthRange = yearMonthDayRange(month);
  const paddedRows = await repository.listTransactionsInRange(db, {
    days: padDayRange(monthRange, PAIRING_WINDOW_PAD_DAYS),
    accountId: null,
  });
  const rowById = new Map(paddedRows.map((row) => [row.id, row]));
  const context: LedgerContext = { rules, kinds, holderDocumentHashes };
  const monthRows = resolveLedgerRows(paddedRows, context).filter(
    (row) =>
      row.date >= monthRange.from &&
      row.date <= monthRange.to &&
      (selectedAccountId === null || row.accountId === selectedAccountId),
  );

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
      incomeLabel: amountsLabel(totals.income),
      spendingLabel: amountsLabel(totals.spending),
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
