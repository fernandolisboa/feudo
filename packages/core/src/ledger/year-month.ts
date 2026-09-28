export type YearMonth = `${number}-${string}`;

const YEAR_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export class InvalidYearMonthError extends Error {
  readonly value: string;

  constructor(value: string) {
    super(`Expected a YYYY-MM month, received ${value}`);
    this.name = "InvalidYearMonthError";
    this.value = value;
  }
}

export function isYearMonth(value: string): value is YearMonth {
  return YEAR_MONTH_PATTERN.test(value);
}

export function parseYearMonth(value: string): YearMonth {
  if (!isYearMonth(value)) {
    throw new InvalidYearMonthError(value);
  }
  return value;
}

function parts(yearMonth: YearMonth): { year: number; month: number } {
  const [year, month] = yearMonth.split("-");
  return { year: Number(year), month: Number(month) };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function yearMonthOf(instant: Date, timeZone: string): YearMonth {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(instant);
  const year = formatted.find((part) => part.type === "year")?.value ?? "";
  const month = formatted.find((part) => part.type === "month")?.value ?? "";
  return parseYearMonth(`${year}-${month}`);
}

export function shiftYearMonth(yearMonth: YearMonth, months: number): YearMonth {
  const { year, month } = parts(yearMonth);
  const index = year * 12 + (month - 1) + months;
  const shiftedYear = Math.floor(index / 12);
  const shiftedMonth = (index % 12) + 1;
  return parseYearMonth(`${String(shiftedYear).padStart(4, "0")}-${pad(shiftedMonth)}`);
}

export type IsoDateRange = { from: string; to: string };

const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class InvalidIsoDateError extends Error {
  readonly value: string;

  constructor(value: string) {
    super(`Expected an ISO YYYY-MM-DD date, received ${value}`);
    this.name = "InvalidIsoDateError";
    this.value = value;
  }
}

// The one place that turns an ISO date string into a UTC instant: a
// malformed value must throw here rather than let Date.parse's NaN collapse
// silently into "same day" arithmetic downstream (businessDaysBetween,
// shiftIsoDate and every caller built on them).
export function isoDateToUtcMidnight(value: string): number {
  if (!ISO_DATE_PATTERN.test(value)) {
    throw new InvalidIsoDateError(value);
  }
  const time = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(time)) {
    throw new InvalidIsoDateError(value);
  }
  return time;
}

export function shiftIsoDate(isoDate: string, days: number): string {
  const shifted = isoDateToUtcMidnight(isoDate) + days * DAY_MS;
  return new Date(shifted).toISOString().slice(0, 10);
}

export function padDayRange(range: IsoDateRange, days: number): IsoDateRange {
  return { from: shiftIsoDate(range.from, -days), to: shiftIsoDate(range.to, days) };
}

export function yearMonthDayRange(yearMonth: YearMonth): IsoDateRange {
  const { year, month } = parts(yearMonth);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${yearMonth}-01`, to: `${yearMonth}-${pad(lastDay)}` };
}

export function formatYearMonth(yearMonth: YearMonth): string {
  const { year, month } = parts(yearMonth);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}
