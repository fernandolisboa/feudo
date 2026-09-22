import { and, asc, count, desc, eq, gte, lte } from "drizzle-orm";

import { bankAccount, bankConnection, bankTransaction } from "@/modules/sync/schema";

import type { IsoDateRange } from "@feudo/core";
import type { HouseholdScope } from "@/modules/households";
import type { Database } from "@/platform/db/client";

export type LedgerAccount = { id: string; name: string; institutionName: string };

export type LedgerTransaction = {
  id: string;
  date: string;
  description: string;
  amountCentavos: number;
  currency: string;
  type: "credit" | "debit";
  accountId: string;
  accountName: string;
  institutionName: string;
};

export type TransactionsFilter = { days: IsoDateRange; accountId: string | null };

export type TransactionsPage = { transactions: LedgerTransaction[]; hasMore: boolean };

// Household-scoped read model over sync's tables (ADR-0001): a transaction is
// visible only through an account assigned to the scoped household, so an
// unassigned account's history is visible to nobody. Never writes.
export function createHouseholdLedgerRepository(scope: HouseholdScope) {
  function matches(filter: TransactionsFilter) {
    return and(
      eq(bankAccount.householdId, scope.householdId),
      filter.accountId === null ? undefined : eq(bankAccount.id, filter.accountId),
      gte(bankTransaction.date, filter.days.from),
      lte(bankTransaction.date, filter.days.to),
    );
  }

  return {
    async listAccounts(db: Database): Promise<LedgerAccount[]> {
      return db
        .select({
          id: bankAccount.id,
          name: bankAccount.name,
          institutionName: bankConnection.institutionName,
        })
        .from(bankAccount)
        .innerJoin(bankConnection, eq(bankConnection.id, bankAccount.connectionId))
        .where(eq(bankAccount.householdId, scope.householdId))
        .orderBy(asc(bankConnection.institutionName), asc(bankAccount.name));
    },

    async countTransactions(db: Database, filter: TransactionsFilter): Promise<number> {
      const [row] = await db
        .select({ total: count() })
        .from(bankTransaction)
        .innerJoin(bankAccount, eq(bankAccount.id, bankTransaction.accountId))
        .where(matches(filter));
      return row?.total ?? 0;
    },

    async listTransactions(
      db: Database,
      filter: TransactionsFilter,
      page: { number: number; size: number },
    ): Promise<TransactionsPage> {
      const rows = await db
        .select({
          id: bankTransaction.id,
          date: bankTransaction.date,
          description: bankTransaction.description,
          amountCentavos: bankTransaction.amountCentavos,
          currency: bankTransaction.currency,
          type: bankTransaction.type,
          accountId: bankAccount.id,
          accountName: bankAccount.name,
          institutionName: bankConnection.institutionName,
        })
        .from(bankTransaction)
        .innerJoin(bankAccount, eq(bankAccount.id, bankTransaction.accountId))
        .innerJoin(bankConnection, eq(bankConnection.id, bankAccount.connectionId))
        .where(matches(filter))
        .orderBy(
          desc(bankTransaction.date),
          asc(bankTransaction.amountCentavos),
          asc(bankTransaction.id),
        )
        .limit(page.size + 1)
        .offset((page.number - 1) * page.size);
      return { transactions: rows.slice(0, page.size), hasMore: rows.length > page.size };
    },
  };
}

export type HouseholdLedgerRepository = ReturnType<typeof createHouseholdLedgerRepository>;
