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
  updateReserveMultiple as updateHouseholdReserveMultiple,
  type HouseholdScope,
} from "@/modules/households";
import { readHouseholdDashboardLines } from "@/modules/ledger";

import { errorName } from "@/lib/error-name";
import type { SimpleOutcome } from "@/lib/outcome";
import type { Database } from "@/platform/db/client";
import {
  createReserveMarkRepository,
  createReserveTargetNoticeRepository,
  createReserveTargetRecordRepository,
  listHouseholdIdsForMonthClose,
  type ReserveMarkInput,
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

  const { lines } = await readHouseholdDashboardLines(db, scope, currentMonth, timeZone);
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
      monthsUsed: target.monthsUsedCount,
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

    const { notify, previousTargetCentavos } = shouldNotifyReserveTargetChange({
      previousAverageFixedCostCentavos: previous?.averageFixedCostCentavos ?? null,
      currentMultiple: multiple,
      nextTargetCentavos: target.targetCentavos,
    });

    if (notify) {
      const noticeRepository = createReserveTargetNoticeRepository(scope);
      await noticeRepository.insert(tx, {
        closedMonth,
        previousTargetCentavos,
        newTargetCentavos: target.targetCentavos,
      });
    }

    return { status: "recorded", notified: notify };
  });
}

export type UpdateReserveMultipleOutcome = SimpleOutcome<"ok" | "failed">;

// The caller (updateReserveMultipleAction) already restricted this to the
// household's owner or admin (CONTEXT.md, "Role"): a member does not reach
// this function at all. Changing the multiple never records a target or a
// notice by itself (packages/core/src/reserve/notice.ts) — it only changes
// what the Reserva page computes live the next time it reads.
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

// Any member of the active household may dismiss the notice (CONTEXT.md,
// "Reserve target notice") — unlike changing the multiple, this is not a
// settings change.
export async function dismissReserveNotice(
  scope: HouseholdScope,
  noticeId: string,
  db: Database,
): Promise<DismissReserveNoticeOutcome> {
  const dismissed = await createReserveTargetNoticeRepository(scope).dismiss(db, noticeId);
  return dismissed ? { status: "ok" } : { status: "not_found" };
}

export type SetReserveMarkOutcome = SimpleOutcome<"ok" | "not_found">;

// Any member of the active household may mark its accounts (CONTEXT.md,
// "Reserve position"): a mark is a household fact, like dismissing the
// notice, not a settings change.
export async function setReserveMark(
  scope: HouseholdScope,
  userId: string,
  input: ReserveMarkInput,
  db: Database,
): Promise<SetReserveMarkOutcome> {
  const status = await createReserveMarkRepository(scope).set(db, input, userId);
  return { status };
}

export type ReserveMonthCloseResult = {
  ok: boolean;
  recorded: number;
  notified: number;
  skipped: number;
  failed: number;
  unreached: number;
};

export type ReserveMonthCloseStep = ReserveMonthCloseResult | { error: string };

// About as long as one household's own close takes end to end (a handful of
// reads plus one transaction) — starting a household with less than this
// left on the run's clock would likely be cut off mid-way, so it is better
// left for tomorrow's run than attempted and lost.
const MIN_HOUSEHOLD_SLICE_MS = 250;

// A fallback for a caller (today, only tests) that does not pass its own
// deadline: the real wiring is /api/cron/daily, which always derives one
// from its own maxDuration and never reaches this default.
const DEFAULT_RUN_BUDGET_MS = 20_000;

// The daily job (cron/daily route): every household, one after the other,
// until the run's deadline, the same shape sync's syncAllConnections uses
// for the same reason (ADR-0001, amended 2026-10-01: job-only enumeration).
// One household's error is caught, counted and logged by household id,
// never failing the rest of the run. A household not even started before
// the deadline is counted `unreached`, not `failed`: listHouseholdIdsForMonthClose
// orders households by id, so a run cut short here still makes deterministic
// progress tomorrow instead of restarting from an arbitrary point. A run
// that leaves anyone unreached is not `ok` either, the same way a failed
// household isn't: both mean the household-local month close did not
// happen, and `unreached` is logged with its count so a shrinking cron
// budget shows up in the logs before it becomes a pattern.
export async function runReserveMonthCloseStep(
  db: Database,
  now: Date = new Date(),
  // Anchored to the real wall clock, not to `now`: `now` is the business
  // date the job resolves "the closed month" against (a test can hold it on
  // a fixed instant), while the deadline has to track actual elapsed time
  // regardless of what `now` says, the same separation sync's
  // syncAllConnections keeps between its own `now` and `deadline` options.
  deadline: Date = new Date(Date.now() + DEFAULT_RUN_BUDGET_MS),
): Promise<ReserveMonthCloseStep> {
  try {
    const scopes = await listHouseholdIdsForMonthClose(db);
    let recorded = 0;
    let notified = 0;
    let skipped = 0;
    let failed = 0;
    let unreached = 0;

    for (let index = 0; index < scopes.length; index += 1) {
      const remainingMs = deadline.getTime() - Date.now();
      if (remainingMs < MIN_HOUSEHOLD_SLICE_MS) {
        unreached += scopes.length - index;
        break;
      }

      const scope = scopes[index];
      if (!scope) {
        continue;
      }

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

    if (unreached > 0) {
      console.warn(`reserve: month close left ${String(unreached)} household(s) unreached`);
    }

    return { ok: failed === 0 && unreached === 0, recorded, notified, skipped, failed, unreached };
  } catch (error) {
    return { error: errorName(error) };
  }
}
