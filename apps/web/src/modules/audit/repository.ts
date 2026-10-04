import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";

import { financialDataAccess, type FinancialDataKind } from "./schema";

import type { FinancialDataAccessScope } from "./scope";
import type { Database, DatabaseOrTransaction } from "@/platform/db/client";

export type FinancialDataAccessRow = {
  id: string;
  kind: FinancialDataKind;
  accessedAt: Date;
};

export type FinancialDataAccessExportRow = {
  householdId: string;
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

    // One statement, so the check and the insert see the same rows; the
    // window is measured on the database clock, the same one that stamps
    // accessed_at.
    async recordUnlessRecent(
      db: DatabaseOrTransaction,
      kind: FinancialDataKind,
      windowSeconds: number,
    ): Promise<void> {
      await db.execute(sql`
        insert into ${financialDataAccess} (id, household_id, user_id, kind)
        select ${crypto.randomUUID()}, ${scope.householdId}, ${scope.userId}, ${kind}::financial_data_access_kind
        where not exists (
          select 1 from ${financialDataAccess}
          where ${financialDataAccess.householdId} = ${scope.householdId}
            and ${financialDataAccess.userId} = ${scope.userId}
            and ${financialDataAccess.kind} = ${kind}::financial_data_access_kind
            and ${financialDataAccess.accessedAt} > now() - make_interval(secs => ${windowSeconds})
        )
      `);
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

    // Counts only by user and kind, across every household (amended
    // 2026-10-03, #25): the export rate limit is per user, not per
    // household, so it deliberately ignores the household half of the scope.
    async countSince(
      db: DatabaseOrTransaction,
      kind: FinancialDataKind,
      since: Date,
    ): Promise<number> {
      const [row] = await db
        .select({ total: count() })
        .from(financialDataAccess)
        .where(
          and(
            eq(financialDataAccess.userId, scope.userId),
            eq(financialDataAccess.kind, kind),
            gte(financialDataAccess.accessedAt, since),
          ),
        );
      return row?.total ?? 0;
    },

    // Every access the scoped user triggered, across every household
    // (amended 2026-10-03, #25): the data export's own financialDataAccess
    // section, unlike listRecentForUser which stays within one household.
    async listAllForUser(db: DatabaseOrTransaction): Promise<FinancialDataAccessExportRow[]> {
      return db
        .select({
          householdId: financialDataAccess.householdId,
          kind: financialDataAccess.kind,
          accessedAt: financialDataAccess.accessedAt,
        })
        .from(financialDataAccess)
        .where(eq(financialDataAccess.userId, scope.userId))
        .orderBy(desc(financialDataAccess.accessedAt));
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
