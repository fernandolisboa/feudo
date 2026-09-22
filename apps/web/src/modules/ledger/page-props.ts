import {
  formatYearMonth,
  shiftYearMonth,
  yearMonthDayRange,
  yearMonthOf,
  type YearMonth,
} from "@feudo/core";

import { getDb } from "@/platform/db/client";
import type { HouseholdSession } from "@/modules/households";
import { DEFAULT_TIME_ZONE, getHouseholdSettings, householdScope } from "@/modules/households";

import {
  createHouseholdLedgerRepository,
  type LedgerAccount,
  type LedgerTransaction,
} from "./repository";
import {
  TRANSACTIONS_PAGE_SIZE,
  transactionsSearchParamsSchema,
  type TransactionsSearchParams,
} from "./validation";

export type TransactionsPageProps = {
  month: YearMonth;
  monthLabel: string;
  previousMonth: YearMonth;
  nextMonth: YearMonth | null;
  accounts: LedgerAccount[];
  selectedAccountId: string | null;
  transactions: LedgerTransaction[];
  total: number;
  page: number;
  hasMore: boolean;
};

// Everything /transacoes renders, so the page stays a composition of this
// slice's components (ADR-0011). The month defaults to today's in the
// household's time zone; an account id not in the household is ignored and
// a page past the last one lands on the last.
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
  const filter = { days: yearMonthDayRange(month), accountId: selectedAccountId };

  const total = await repository.countTransactions(db, filter);
  const lastPage = Math.max(1, Math.ceil(total / TRANSACTIONS_PAGE_SIZE));
  const page = Math.min(params.pagina ?? 1, lastPage);
  const listed = await repository.listTransactions(db, filter, {
    number: page,
    size: TRANSACTIONS_PAGE_SIZE,
  });

  return {
    month,
    monthLabel: formatYearMonth(month),
    previousMonth: shiftYearMonth(month, -1),
    nextMonth: month < currentMonth ? shiftYearMonth(month, 1) : null,
    accounts,
    selectedAccountId,
    transactions: listed.transactions,
    total,
    page,
    hasMore: listed.hasMore,
  };
}
