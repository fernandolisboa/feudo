import { and, desc, eq, lt } from "drizzle-orm";

import { financialDataAccess, type FinancialDataKind } from "./schema";

import type { FinancialDataAccessScope } from "./scope";
import type { Database, DatabaseOrTransaction } from "@/platform/db/client";

export type FinancialDataAccessRow = {
  id: string;
  kind: FinancialDataKind;
  accessedAt: Date;
};

export const RECENT_ACCESS_LIMIT = 20;

// Every repository is constructed with the household and user taken from
// the session (ADR-0001, amended 2026-10-03 #27): no method below accepts a
// household or user id, only the scope closed over at construction time.
export function createFinancialDataAccessRepository(scope: FinancialDataAccessScope) {
  return {
    async record(db: DatabaseOrTransaction, kind: FinancialDataKind): Promise<void> {
      await db
        .insert(financialDataAccess)
        .values({ householdId: scope.householdId, userId: scope.userId, kind });
    },

    async listRecentForUser(
      db: DatabaseOrTransaction,
      limit: number = RECENT_ACCESS_LIMIT,
    ): Promise<FinancialDataAccessRow[]> {
      return db
        .select({
          id: financialDataAccess.id,
          kind: financialDataAccess.kind,
          accessedAt: financialDataAccess.accessedAt,
        })
        .from(financialDataAccess)
        .where(
          and(
            eq(financialDataAccess.householdId, scope.householdId),
            eq(financialDataAccess.userId, scope.userId),
          ),
        )
        .orderBy(desc(financialDataAccess.accessedAt))
        .limit(limit);
    },
  };
}

export type FinancialDataAccessRepository = ReturnType<typeof createFinancialDataAccessRepository>;

// Job-only (ADR-0001): the daily prune step deletes across every household
// at once, the same shape as households' pruneExpiredInvitations and sync's
// consent/auth-attempt prune — never imported by request-handling code, and
// never fed a client-supplied id.
export async function deleteAccessOlderThan(db: Database, cutoff: Date): Promise<number> {
  const result = await db
    .delete(financialDataAccess)
    .where(lt(financialDataAccess.accessedAt, cutoff));
  return result.rowCount ?? 0;
}
