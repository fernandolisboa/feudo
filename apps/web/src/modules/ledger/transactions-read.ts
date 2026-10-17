import {
  categoryOf,
  localDateOf,
  normalizeDescription,
  yearMonthDayRange,
  yearMonthOf,
  type IsoDateRange,
  type Kind,
  type KindContext,
  type ProductCategoryId,
  type YearMonth,
} from "@feudo/core";

import { getDb } from "@/platform/db/client";
import type { HouseholdSession } from "@/modules/households";
import { DEFAULT_TIME_ZONE, getHouseholdSettings, householdScope } from "@/modules/households";

import { UNCATEGORIZED_FILTER } from "./href";
import { readHouseholdLedger } from "./ledger-read";
import { createHouseholdLedgerRepository, type LedgerAccount } from "./repository";
import type { ResolvedLedgerRow } from "./resolve-ledger-rows";
import { transactionsSearchParamsSchema, type TransactionsSearchParams } from "./validation";

export type FilteredTransactions = {
  currentMonth: YearMonth;
  month: YearMonth;
  range: IsoDateRange | null;
  todayIso: string;
  accounts: LedgerAccount[];
  selectedAccountId: string | null;
  uncategorizedOnly: boolean;
  selectedCategory: ProductCategoryId | null;
  selectedKind: Kind | null;
  searchQuery: string | null;
  requestedPage: number;
  kinds: KindContext;
  monthRows: ResolvedLedgerRow[];
  padded: ResolvedLedgerRow[];
  filteredRows: ResolvedLedgerRow[];
  listed: ResolvedLedgerRow[];
};

function matchesCategory(
  row: ResolvedLedgerRow,
  category: ProductCategoryId | null,
  kinds: KindContext,
): boolean {
  if (category === null) return true;
  return (
    row.categorization !== null && categoryOf(row.categorization.subcategory, kinds) === category
  );
}

function matchesKind(row: ResolvedLedgerRow, kind: Kind | null): boolean {
  return kind === null || row.kind === kind;
}

function matchesSearch(row: ResolvedLedgerRow, normalizedQuery: string): boolean {
  return normalizedQuery === "" || normalizeDescription(row.description).includes(normalizedQuery);
}

function clampToToday(isoDate: string, todayIso: string): string {
  return isoDate < todayIso ? isoDate : todayIso;
}

// "ate" defaults to today; a reversed pair is swapped rather than rejected,
// so typing the wedding date into "Até" by mistake still shows something
// sensible instead of an empty range. The swap happens on the raw pair
// first, and only then is each end clamped to today (the same clamp the
// month view applies to "mes"): clamping "ate" before the swap would let a
// future "de" with no "ate" survive as the swapped `to`, producing a range
// that reaches years into the future instead of collapsing to today.
function resolveDateRange(
  from: string,
  requestedTo: string | undefined,
  todayIso: string,
): IsoDateRange {
  const rawTo = requestedTo ?? todayIso;
  const [earlier, later] = from > rawTo ? [rawTo, from] : [from, rawTo];
  return { from: clampToToday(earlier, todayIso), to: clampToToday(later, todayIso) };
}

// The one reading of /transacoes' URL shared by the page and its spreadsheet,
// so the file always holds exactly the rows the screen lists. A "de" that
// survives validation puts the screen in range mode: "mes" is then ignored
// entirely and "month" below is just the household's current month, used
// only as the fallback a range drops back to ("Ver por mês", "Limpar
// filtros"). Without a "de", the month defaults to today's in the
// household's time zone and never moves past it, even from a crafted URL;
// an account id not in the household is ignored. `filteredRows` is what the
// totals count (uncategorized rows count in no total, so the sem filter
// never narrows them); `listed` is what the table shows. Records no access:
// each caller does that after its own read succeeds (ADR-0008).
export async function readFilteredTransactions(
  session: HouseholdSession,
  searchParams: TransactionsSearchParams,
  now: Date,
): Promise<FilteredTransactions> {
  const db = getDb();
  const scope = householdScope(session);
  const repository = createHouseholdLedgerRepository(scope);
  const params = transactionsSearchParamsSchema.parse(searchParams);

  const [settings, accounts] = await Promise.all([
    getHouseholdSettings(scope, db),
    repository.listAccounts(db),
  ]);
  const timeZone = settings?.timeZone ?? DEFAULT_TIME_ZONE;
  const currentMonth = yearMonthOf(now, timeZone);
  const todayIso = localDateOf(now, timeZone);
  const range = params.de !== undefined ? resolveDateRange(params.de, params.ate, todayIso) : null;
  const requestedMonth = params.mes ?? currentMonth;
  const clampedMonth = requestedMonth > currentMonth ? currentMonth : requestedMonth;
  const month = range ? currentMonth : clampedMonth;
  const selectedAccountId = accounts.some((account) => account.id === params.conta)
    ? (params.conta ?? null)
    : null;
  const uncategorizedOnly = params.categoria === UNCATEGORIZED_FILTER;
  const selectedCategory =
    params.categoria !== undefined && params.categoria !== UNCATEGORIZED_FILTER
      ? params.categoria
      : null;
  const selectedKind = params.tipo ?? null;
  const rawSearch = params.busca && params.busca.length > 0 ? params.busca : null;
  const normalizedSearch = rawSearch !== null ? normalizeDescription(rawSearch) : "";
  const searchQuery = normalizedSearch !== "" ? rawSearch : null;

  const {
    kinds,
    rows: monthRows,
    padded,
  } = await readHouseholdLedger(
    db,
    scope,
    range ?? yearMonthDayRange(month),
    selectedAccountId,
    timeZone,
  );

  const filteredRows = monthRows.filter(
    (row) =>
      matchesCategory(row, selectedCategory, kinds) &&
      matchesKind(row, selectedKind) &&
      matchesSearch(row, normalizedSearch),
  );
  const listed = uncategorizedOnly
    ? filteredRows.filter((row) => row.categorization === null)
    : filteredRows;

  return {
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
    requestedPage: params.pagina ?? 1,
    kinds,
    monthRows,
    padded,
    filteredRows,
    listed,
  };
}
