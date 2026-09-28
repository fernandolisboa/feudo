import type { IsoDateRange } from "@feudo/core";

// A pair's two legs can land on either side of the queried month (a bill
// paid on the 1st for a purchase window closing on the last day of the
// previous one), so the read that feeds resolveLedger widens by more than
// MAX_TRANSFER_BUSINESS_DAYS of calendar days to also clear a long weekend.
export const PAIRING_WINDOW_PAD_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDateOf(instant: number): string {
  return new Date(instant).toISOString().slice(0, 10);
}

export function padDayRange(range: IsoDateRange, days: number): IsoDateRange {
  const from = Date.parse(`${range.from}T00:00:00Z`) - days * DAY_MS;
  const to = Date.parse(`${range.to}T00:00:00Z`) + days * DAY_MS;
  return { from: isoDateOf(from), to: isoDateOf(to) };
}
