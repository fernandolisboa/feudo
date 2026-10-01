import { and, asc, desc, eq, isNull, lt, lte } from "drizzle-orm";

import { organization } from "@/modules/auth/schema";

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

const reserveTargetRecordColumns = {
  id: reserveTargetRecord.id,
  closedMonth: reserveTargetRecord.closedMonth,
  averageFixedCostCentavos: reserveTargetRecord.averageFixedCostCentavos,
  monthsUsed: reserveTargetRecord.monthsUsed,
  isEstimate: reserveTargetRecord.isEstimate,
  reserveMultiple: reserveTargetRecord.reserveMultiple,
  targetCentavos: reserveTargetRecord.targetCentavos,
  currency: reserveTargetRecord.currency,
  createdAt: reserveTargetRecord.createdAt,
};

// `closed_month` is a plain text column (Drizzle infers `string`); every
// value in it was itself written as a YearMonth (insert's own parameter
// type below), so this is the one place that narrows the column back to
// the branded type the rest of the codebase relies on.
function toRecordRow(
  row: Omit<ReserveTargetRecordRow, "closedMonth"> & { closedMonth: string },
): ReserveTargetRecordRow {
  return { ...row, closedMonth: row.closedMonth as YearMonth };
}

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
        .select(reserveTargetRecordColumns)
        .from(reserveTargetRecord)
        .where(
          and(
            eq(reserveTargetRecord.householdId, scope.householdId),
            eq(reserveTargetRecord.closedMonth, closedMonth),
          ),
        )
        .limit(1);
      return rows[0] ? toRecordRow(rows[0]) : undefined;
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
        .select(reserveTargetRecordColumns)
        .from(reserveTargetRecord)
        .where(
          and(
            eq(reserveTargetRecord.householdId, scope.householdId),
            lt(reserveTargetRecord.closedMonth, closedMonth),
          ),
        )
        .orderBy(desc(reserveTargetRecord.closedMonth))
        .limit(1);
      return rows[0] ? toRecordRow(rows[0]) : undefined;
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
        .returning(reserveTargetRecordColumns);
      return rows[0] ? toRecordRow(rows[0]) : undefined;
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

const reserveTargetNoticeColumns = {
  id: reserveTargetNotice.id,
  closedMonth: reserveTargetNotice.closedMonth,
  previousTargetCentavos: reserveTargetNotice.previousTargetCentavos,
  newTargetCentavos: reserveTargetNotice.newTargetCentavos,
  createdAt: reserveTargetNotice.createdAt,
  dismissedAt: reserveTargetNotice.dismissedAt,
};

function toNoticeRow(
  row: Omit<ReserveTargetNoticeRow, "closedMonth"> & { closedMonth: string },
): ReserveTargetNoticeRow {
  return { ...row, closedMonth: row.closedMonth as YearMonth };
}

export function createReserveTargetNoticeRepository(scope: HouseholdScope) {
  return {
    async getUndismissed(db: DatabaseOrTransaction): Promise<ReserveTargetNoticeRow | undefined> {
      const rows = await db
        .select(reserveTargetNoticeColumns)
        .from(reserveTargetNotice)
        .where(
          and(
            eq(reserveTargetNotice.householdId, scope.householdId),
            isNull(reserveTargetNotice.dismissedAt),
          ),
        )
        .orderBy(desc(reserveTargetNotice.closedMonth))
        .limit(1);
      return rows[0] ? toNoticeRow(rows[0]) : undefined;
    },

    async insert(db: DatabaseOrTransaction, notice: NewReserveTargetNotice): Promise<void> {
      await db
        .insert(reserveTargetNotice)
        .values({ householdId: scope.householdId, ...notice })
        .onConflictDoNothing();
    },

    // Idempotent and household-wide (CONTEXT.md, "Reserve target notice"):
    // dismissing an id that exists in this household marks it, and every
    // other undismissed notice of this household created up to the same
    // month, as dismissed — a household never has an older unread notice
    // hanging around once a later one has been seen. Dismissing a notice
    // that is already dismissed still returns true (nothing left to update,
    // but the id is real and belongs here); an unknown id, or one from
    // another household, returns false without writing anything
    // (ADR-0001: never accepts an unscoped id).
    async dismiss(db: Database, noticeId: string): Promise<boolean> {
      return db.transaction(async (tx) => {
        const rows = await tx
          .select({ closedMonth: reserveTargetNotice.closedMonth })
          .from(reserveTargetNotice)
          .where(
            and(
              eq(reserveTargetNotice.id, noticeId),
              eq(reserveTargetNotice.householdId, scope.householdId),
            ),
          )
          .limit(1);
        const notice = rows[0];
        if (!notice) {
          return false;
        }

        await tx
          .update(reserveTargetNotice)
          .set({ dismissedAt: new Date() })
          .where(
            and(
              eq(reserveTargetNotice.householdId, scope.householdId),
              lte(reserveTargetNotice.closedMonth, notice.closedMonth),
              isNull(reserveTargetNotice.dismissedAt),
            ),
          );
        return true;
      });
    },
  };
}

export type ReserveTargetNoticeRepository = ReturnType<typeof createReserveTargetNoticeRepository>;

// Job-only (ADR-0001, amended 2026-10-01): a daily cron step runs once per
// household, not once per session, so it needs every household rather than
// the session-derived scope every other caller gets. Lives in this slice's
// own repository, not on households' public index, the same way sync's
// listConnectionsToSync lives in sync's own repository — never imported by
// request-handling code, and never fed a client-supplied id. Ordered by id
// so a run cut short by runReserveMonthCloseStep's deadline still makes
// deterministic progress the next day instead of restarting from wherever
// the database happened to return rows first.
export async function listHouseholdIdsForMonthClose(db: Database): Promise<HouseholdScope[]> {
  const rows = await db
    .select({ householdId: organization.id })
    .from(organization)
    .orderBy(asc(organization.id));
  return rows.map((row) => ({ householdId: row.householdId }));
}
