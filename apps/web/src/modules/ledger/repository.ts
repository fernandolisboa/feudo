import { and, asc, desc, eq, gte, isNotNull, lte } from "drizzle-orm";

import { bankAccount, bankConnection, bankTransaction } from "@/modules/sync/schema";

import { manualSubcategoryRefFrom } from "./categorization-repository";
import { internalTransferMark, transactionCategorization } from "./schema";

import type { IsoDateRange, LedgerAccountType, SubcategoryRef } from "@feudo/core";
import type { HouseholdScope } from "@/modules/households";
import type { Database } from "@/platform/db/client";

type TransactionType = (typeof bankTransaction.$inferSelect)["type"];

export type LedgerAccount = { id: string; name: string; institutionName: string };

export type LedgerTransactionRow = {
  id: string;
  date: string;
  description: string;
  amountCentavos: number;
  currency: string;
  type: TransactionType;
  providerCategory: string | null;
  accountId: string;
  accountName: string;
  institutionName: string;
  accountType: LedgerAccountType;
  counterpartDocumentHash: string | null;
  manual: SubcategoryRef | null;
  transferMark: boolean | null;
};

export type TransactionsFilter = { days: IsoDateRange; accountId: string | null };

// Household-scoped read model over sync's tables (ADR-0001): a transaction is
// visible only through an account assigned to the scoped household, so an
// unassigned account's history is visible to nobody. Never writes.
// Categorization is resolved at read time by packages/core (the design
// contract's precedence: manual > household rule > product default rule >
// provider category mapping); this repository only supplies the two facts
// that resolution needs and this slice persists, providerCategory and the
// transaction's manual choice, resolved for this scope (manualSubcategoryRefFrom
// hides a household ref that belongs to a different household than scope).
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

    // Every account holder document Feudo has hashed for this household,
    // never a household-wide secret since the hash never round-trips to the
    // original document (sync/document-hash.ts): pairInternalTransfers only
    // uses it to check that a transaction's counterpart, when known, is one
    // of the household's own account holders.
    async listHolderDocumentHashes(db: Database): Promise<Set<string>> {
      const rows = await db
        .select({ holderDocumentHash: bankAccount.holderDocumentHash })
        .from(bankAccount)
        .where(
          and(
            eq(bankAccount.householdId, scope.householdId),
            isNotNull(bankAccount.holderDocumentHash),
          ),
        );
      return new Set(
        rows.flatMap((row) => (row.holderDocumentHash ? [row.holderDocumentHash] : [])),
      );
    },

    // Every transaction of the filter, unpaginated: a household's month is a
    // few hundred rows at most, so pagination and recurring-spend detection
    // (both callers) slice this in memory instead of round-tripping per page.
    async listTransactionsInRange(
      db: Database,
      filter: TransactionsFilter,
    ): Promise<LedgerTransactionRow[]> {
      const rows = await db
        .select({
          id: bankTransaction.id,
          date: bankTransaction.date,
          description: bankTransaction.description,
          amountCentavos: bankTransaction.amountCentavos,
          currency: bankTransaction.currency,
          type: bankTransaction.type,
          providerCategory: bankTransaction.providerCategory,
          counterpartDocumentHash: bankTransaction.counterpartDocumentHash,
          accountId: bankAccount.id,
          accountName: bankAccount.name,
          accountType: bankAccount.type,
          institutionName: bankConnection.institutionName,
          manualProductSubcategoryId: transactionCategorization.productSubcategoryId,
          manualHouseholdSubcategoryId: transactionCategorization.householdSubcategoryId,
          manualSubcategoryHouseholdId: transactionCategorization.subcategoryHouseholdId,
          transferMark: internalTransferMark.isInternalTransfer,
        })
        .from(bankTransaction)
        .innerJoin(bankAccount, eq(bankAccount.id, bankTransaction.accountId))
        .innerJoin(bankConnection, eq(bankConnection.id, bankAccount.connectionId))
        .leftJoin(
          transactionCategorization,
          eq(transactionCategorization.transactionId, bankTransaction.id),
        )
        .leftJoin(internalTransferMark, eq(internalTransferMark.transactionId, bankTransaction.id))
        .where(matches(filter))
        .orderBy(
          desc(bankTransaction.date),
          asc(bankTransaction.amountCentavos),
          asc(bankTransaction.id),
        );
      return rows.map(
        ({
          manualProductSubcategoryId,
          manualHouseholdSubcategoryId,
          manualSubcategoryHouseholdId,
          ...row
        }) => ({
          ...row,
          manual: manualSubcategoryRefFrom(
            manualProductSubcategoryId,
            manualHouseholdSubcategoryId,
            manualSubcategoryHouseholdId,
            scope.householdId,
          ),
        }),
      );
    },
  };
}

export type HouseholdLedgerRepository = ReturnType<typeof createHouseholdLedgerRepository>;
