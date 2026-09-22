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
