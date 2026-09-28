import { isoDateToUtcMidnight } from "../year-month";

const DAY_MS = 24 * 60 * 60 * 1000;
const SUNDAY = 0;
const SATURDAY = 6;

export function businessDaysBetween(a: string, b: string): number {
  const aTime = isoDateToUtcMidnight(a);
  const bTime = isoDateToUtcMidnight(b);
  const earlier = Math.min(aTime, bTime);
  const later = Math.max(aTime, bTime);
  const calendarDays = Math.round((later - earlier) / DAY_MS);

  let businessDays = 0;
  for (let offset = 1; offset <= calendarDays; offset += 1) {
    const dayOfWeek = new Date(earlier + offset * DAY_MS).getUTCDay();
    if (dayOfWeek !== SUNDAY && dayOfWeek !== SATURDAY) {
      businessDays += 1;
    }
  }
  return businessDays;
}
