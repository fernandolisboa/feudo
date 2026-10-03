import { shiftYearMonth, type YearMonth } from "../ledger/year-month";

export const DELETION_GRACE_DAYS = 7;

const GRACE_MS = DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000;

export function deletionPurgeAt(requestedAt: Date): Date {
  return new Date(requestedAt.getTime() + GRACE_MS);
}

export function deletionPurgeCutoff(now: Date): Date {
  return new Date(now.getTime() - GRACE_MS);
}

export type YearMonthRange = { from: YearMonth; to: YearMonth };

export function groupConsecutiveMonths(months: readonly YearMonth[]): YearMonthRange[] {
  const sorted = [...new Set(months)].sort();
  const ranges: YearMonthRange[] = [];
  for (const month of sorted) {
    const last = ranges.at(-1);
    if (last && shiftYearMonth(last.to, 1) === month) {
      last.to = month;
    } else {
      ranges.push({ from: month, to: month });
    }
  }
  return ranges;
}
