const FIRST_RUN_LOOKBACK_MONTHS = 24;
const SGS_MAX_WINDOW_YEARS = 10;
const DAILY_BACKFILL_OVERLAP_DAYS = 5;
const MONTHLY_BACKFILL_OVERLAP_MONTHS = 1;

export type SeriesFrequency = "daily" | "monthly";

export interface FetchWindow {
  fromISODate: string;
  toISODate: string;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysInUTCMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function subtractMonthsUTC(date: Date, months: number): Date {
  const targetMonthIndex = date.getUTCMonth() - months;
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const clampedDay = Math.min(date.getUTCDate(), daysInUTCMonth(targetYear, targetMonth));
  return new Date(Date.UTC(targetYear, targetMonth, clampedDay));
}

function subtractYearsUTC(date: Date, years: number): Date {
  const targetYear = date.getUTCFullYear() - years;
  const month = date.getUTCMonth();
  const clampedDay = Math.min(date.getUTCDate(), daysInUTCMonth(targetYear, month));
  return new Date(Date.UTC(targetYear, month, clampedDay));
}

function addDaysUTC(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

function overlapBeforeLastStoredDate(lastStoredDate: Date, frequency: SeriesFrequency): Date {
  switch (frequency) {
    case "daily":
      return addDaysUTC(lastStoredDate, -DAILY_BACKFILL_OVERLAP_DAYS);
    case "monthly":
      return subtractMonthsUTC(lastStoredDate, MONTHLY_BACKFILL_OVERLAP_MONTHS);
  }
}

export function computeFetchWindow(
  now: Date,
  lastStoredDateISO: string | undefined,
  frequency: SeriesFrequency,
): FetchWindow {
  // SGS rejects a query spanning exactly 10 years; staying one day inside the
  // (leap-day-clamped) 10-year mark keeps every window strictly under the limit.
  const earliestAllowed = addDaysUTC(subtractYearsUTC(now, SGS_MAX_WINDOW_YEARS), 1);
  const desiredFrom = lastStoredDateISO
    ? overlapBeforeLastStoredDate(new Date(`${lastStoredDateISO}T00:00:00.000Z`), frequency)
    : subtractMonthsUTC(now, FIRST_RUN_LOOKBACK_MONTHS);
  const from = desiredFrom < earliestAllowed ? earliestAllowed : desiredFrom;

  return {
    fromISODate: toISODate(from),
    toISODate: toISODate(now),
  };
}
