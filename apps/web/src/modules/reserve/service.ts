import {
  averageFixedCost,
  computeReserveTarget,
  DEFAULT_RESERVE_MULTIPLE,
  HOUSEHOLD_CURRENCY,
  shiftYearMonth,
  shouldNotifyReserveTargetChange,
  yearMonthOf,
  type ReserveTarget,
} from "@feudo/core";

import {
  DEFAULT_TIME_ZONE,
  getHouseholdSettings,
  listHouseholdScopesForJob,
  updateReserveMultiple as updateHouseholdReserveMultiple,
  type HouseholdScope,
} from "@/modules/households";
import { readHouseholdDashboardLines } from "@/modules/ledger";

import { errorName } from "@/lib/error-name";
import type { SimpleOutcome } from "@/lib/outcome";
import type { Database } from "@/platform/db/client";
import {
  createReserveTargetNoticeRepository,
  createReserveTargetRecordRepository,
} from "./repository";

export type MonthCloseOutcome = { status: "skipped" } | { status: "recorded"; notified: boolean };

// One household, one month close: idempotent (a record already closed for
// `closedMonth` is left untouched), and records nothing when the household
// has no categorized month in the window at all (CONTEXT.md, "Reserve
// target"). `now` resolves the household-local current month (its own time
// zone, default America/Sao_Paulo); the closed month is always the one
// immediately before it, so the daily job always closes "yesterday's month"
// once it has fully elapsed.
export async function closeReserveTargetMonthForHousehold(
  db: Database,
  scope: HouseholdScope,
  now: Date,
): Promise<MonthCloseOutcome> {
  const settings = await getHouseholdSettings(scope, db);
  const timeZone = settings?.timeZone ?? DEFAULT_TIME_ZONE;
  const multiple = settings?.reserveMultiple ?? DEFAULT_RESERVE_MULTIPLE;
  const currentMonth = yearMonthOf(now, timeZone);
  const closedMonth = shiftYearMonth(currentMonth, -1);

  const recordRepository = createReserveTargetRecordRepository(scope);
  const existing = await recordRepository.getByMonth(db, closedMonth);
  if (existing) {
    return { status: "skipped" };
  }

  const lines = await readHouseholdDashboardLines(db, scope, currentMonth, timeZone);
  const detail = averageFixedCost({ month: currentMonth, lines });
  if (detail.average === null) {
    return { status: "skipped" };
  }

  const target: ReserveTarget = computeReserveTarget(detail.average, multiple);

  return db.transaction(async (tx) => {
    const previous = await recordRepository.getLatestBefore(tx, closedMonth);

    const inserted = await recordRepository.insert(tx, {
      closedMonth,
      averageFixedCostCentavos: target.averageFixedCostCentavos,
      monthsUsed: target.monthsUsed,
      isEstimate: target.isEstimate,
      reserveMultiple: target.multiple,
      targetCentavos: target.targetCentavos,
      currency: HOUSEHOLD_CURRENCY,
    });
    if (!inserted) {
      // Lost the race against a concurrent run for the same household and
      // month: the unique constraint is the real guard, this is just the
      // outcome it leaves for the caller.
      return { status: "skipped" };
    }

    const notified = shouldNotifyReserveTargetChange({
      previousAverageFixedCostCentavos: previous?.averageFixedCostCentavos ?? null,
      currentMultiple: multiple,
      nextTargetCentavos: target.targetCentavos,
    });

    if (notified && previous) {
      const noticeRepository = createReserveTargetNoticeRepository(scope);
      await noticeRepository.insert(tx, {
        closedMonth,
        previousTargetCentavos: previous.averageFixedCostCentavos * multiple,
        newTargetCentavos: target.targetCentavos,
      });
    }

    return { status: "recorded", notified };
  });
}

export type UpdateReserveMultipleOutcome = SimpleOutcome<"ok" | "failed">;

// Any member of the active household (requireHouseholdSession, same as the
// categorization actions): changing the multiple never records a target or
// a notice by itself (packages/core/src/reserve/notice.ts) — it only
// changes what the Reserva page computes live the next time it reads.
export async function setHouseholdReserveMultiple(
  scope: HouseholdScope,
  reserveMultiple: number,
  db: Database,
): Promise<UpdateReserveMultipleOutcome> {
  try {
    await updateHouseholdReserveMultiple(scope, reserveMultiple, db);
    return { status: "ok" };
  } catch (error) {
    console.warn(`reserve: updating the multiple failed (${errorName(error)})`);
    return { status: "failed" };
  }
}

export type DismissReserveNoticeOutcome = SimpleOutcome<"ok" | "not_found">;

export async function dismissReserveNotice(
  scope: HouseholdScope,
  noticeId: string,
  db: Database,
): Promise<DismissReserveNoticeOutcome> {
  const dismissed = await createReserveTargetNoticeRepository(scope).dismiss(db, noticeId);
  return dismissed ? { status: "ok" } : { status: "not_found" };
}

export type ReserveMonthCloseResult = {
  ok: boolean;
  recorded: number;
  notified: number;
  skipped: number;
  failed: number;
};

export type ReserveMonthCloseStep = ReserveMonthCloseResult | { error: string };

// The daily job (cron/daily route): every household, one after the other.
// One household's error is caught, counted and logged by household id, never
// failing the rest of the run (the same shape sync's syncAllConnections
// uses for the same reason).
export async function runReserveMonthCloseStep(
  db: Database,
  now: Date = new Date(),
): Promise<ReserveMonthCloseStep> {
  try {
    const scopes = await listHouseholdScopesForJob(db);
    let recorded = 0;
    let notified = 0;
    let skipped = 0;
    let failed = 0;

    for (const scope of scopes) {
      try {
        const outcome = await closeReserveTargetMonthForHousehold(db, scope, now);
        if (outcome.status === "skipped") {
          skipped += 1;
        } else {
          recorded += 1;
          if (outcome.notified) {
            notified += 1;
          }
        }
      } catch (error) {
        failed += 1;
        console.warn(
          `reserve: month close failed for household ${scope.householdId} (${errorName(error)})`,
        );
      }
    }

    return { ok: failed === 0, recorded, notified, skipped, failed };
  } catch (error) {
    return { error: errorName(error) };
  }
}
