import { and, desc, eq, isNull, lt } from "drizzle-orm";

import { reserveTargetNotice, reserveTargetRecord } from "./schema";

import type { YearMonth } from "@feudo/core";
import type { HouseholdScope } from "@/modules/households";
import type { Database, DatabaseOrTransaction } from "@/platform/db/client";

export type ReserveTargetRecordRow = {
  id: string;
  closedMonth: YearMonth;
  averageFixedCostCentavos: number;
  monthsUsed: number;
  isEstimate: boolean;
  reserveMultiple: number;
  targetCentavos: number;
  currency: string;
  createdAt: Date;
};

export type NewReserveTargetRecord = {
  closedMonth: YearMonth;
  averageFixedCostCentavos: number;
  monthsUsed: number;
  isEstimate: boolean;
  reserveMultiple: number;
  targetCentavos: number;
  currency: string;
};

// Every repository is constructed with the household taken from the session
// or job scope (ADR-0001): no method below accepts a household id, only the
// scope closed over at construction time.
export function createReserveTargetRecordRepository(scope: HouseholdScope) {
  return {
    async getByMonth(
      db: DatabaseOrTransaction,
      closedMonth: YearMonth,
    ): Promise<ReserveTargetRecordRow | undefined> {
      const rows = await db
        .select()
        .from(reserveTargetRecord)
        .where(
          and(
            eq(reserveTargetRecord.householdId, scope.householdId),
            eq(reserveTargetRecord.closedMonth, closedMonth),
          ),
        )
        .limit(1);
      return rows[0] as ReserveTargetRecordRow | undefined;
    },

    // The most recent record strictly before `closedMonth`, whatever its own
    // month: a gap in the job's own history (a skipped day, a late household)
    // still compares against the last number this household actually saw,
    // not against an assumed-contiguous previous month.
    async getLatestBefore(
      db: DatabaseOrTransaction,
      closedMonth: YearMonth,
    ): Promise<ReserveTargetRecordRow | undefined> {
      const rows = await db
        .select()
        .from(reserveTargetRecord)
        .where(
          and(
            eq(reserveTargetRecord.householdId, scope.householdId),
            lt(reserveTargetRecord.closedMonth, closedMonth),
          ),
        )
        .orderBy(desc(reserveTargetRecord.closedMonth))
        .limit(1);
      return rows[0] as ReserveTargetRecordRow | undefined;
    },

    // onConflictDoNothing against the (household, month) unique constraint is
    // the idempotency guarantee itself: two concurrent runs racing to close
    // the same month leave exactly one record, and the loser's empty
    // `returning()` tells the caller to record nothing further.
    async insert(
      db: DatabaseOrTransaction,
      record: NewReserveTargetRecord,
    ): Promise<ReserveTargetRecordRow | undefined> {
      const rows = await db
        .insert(reserveTargetRecord)
        .values({ householdId: scope.householdId, ...record })
        .onConflictDoNothing()
        .returning();
      return rows[0] as ReserveTargetRecordRow | undefined;
    },
  };
}

export type ReserveTargetRecordRepository = ReturnType<typeof createReserveTargetRecordRepository>;

export type ReserveTargetNoticeRow = {
  id: string;
  closedMonth: YearMonth;
  previousTargetCentavos: number;
  newTargetCentavos: number;
  createdAt: Date;
  dismissedAt: Date | null;
};

export type NewReserveTargetNotice = {
  closedMonth: YearMonth;
  previousTargetCentavos: number;
  newTargetCentavos: number;
};

export function createReserveTargetNoticeRepository(scope: HouseholdScope) {
  return {
    async getUndismissed(db: DatabaseOrTransaction): Promise<ReserveTargetNoticeRow | undefined> {
      const rows = await db
        .select()
        .from(reserveTargetNotice)
        .where(
          and(
            eq(reserveTargetNotice.householdId, scope.householdId),
            isNull(reserveTargetNotice.dismissedAt),
          ),
        )
        .orderBy(desc(reserveTargetNotice.closedMonth))
        .limit(1);
      return rows[0] as ReserveTargetNoticeRow | undefined;
    },

    async insert(db: DatabaseOrTransaction, notice: NewReserveTargetNotice): Promise<void> {
      await db
        .insert(reserveTargetNotice)
        .values({ householdId: scope.householdId, ...notice })
        .onConflictDoNothing();
    },

    // A no-op (not an error) when the id does not exist, or belongs to
    // another household: the caller turns an empty result into "not_found"
    // without this repository ever accepting an unscoped id (ADR-0001).
    async dismiss(db: Database, noticeId: string): Promise<boolean> {
      const updated = await db
        .update(reserveTargetNotice)
        .set({ dismissedAt: new Date() })
        .where(
          and(
            eq(reserveTargetNotice.id, noticeId),
            eq(reserveTargetNotice.householdId, scope.householdId),
            isNull(reserveTargetNotice.dismissedAt),
          ),
        )
        .returning({ id: reserveTargetNotice.id });
      return updated.length > 0;
    },
  };
}

export type ReserveTargetNoticeRepository = ReturnType<typeof createReserveTargetNoticeRepository>;
