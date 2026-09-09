const FIRST_RUN_LOOKBACK_MONTHS = 24;
const SGS_MAX_WINDOW_YEARS = 10;

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
  return new Date(Date.UTC(date.getUTCFullYear() - years, date.getUTCMonth(), date.getUTCDate()));
}

function addDaysUTC(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

export function computeFetchWindow(now: Date, lastStoredDateISO: string | undefined): FetchWindow {
  // SGS rejects a query spanning exactly 10 years; staying one day inside keeps every
  // window strictly under the limit regardless of leap years.
  const earliestAllowed = addDaysUTC(subtractYearsUTC(now, SGS_MAX_WINDOW_YEARS), 1);
  const desiredFrom = lastStoredDateISO
    ? new Date(`${lastStoredDateISO}T00:00:00.000Z`)
    : subtractMonthsUTC(now, FIRST_RUN_LOOKBACK_MONTHS);
  const from = desiredFrom < earliestAllowed ? earliestAllowed : desiredFrom;

  return {
    fromISODate: toISODate(from),
    toISODate: toISODate(now),
  };
}
