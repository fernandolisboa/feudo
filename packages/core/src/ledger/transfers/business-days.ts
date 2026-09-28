import { calendarDaysBetween, DAY_MS, isoDateToUtcMidnight } from "../year-month";

const SUNDAY = 0;
const SATURDAY = 6;

export function businessDaysBetween(a: string, b: string): number {
  const aTime = isoDateToUtcMidnight(a);
  const bTime = isoDateToUtcMidnight(b);
  const earlier = Math.min(aTime, bTime);
  const calendarDays = calendarDaysBetween(a, b);

  let businessDays = 0;
  for (let offset = 1; offset <= calendarDays; offset += 1) {
    const dayOfWeek = new Date(earlier + offset * DAY_MS).getUTCDay();
    if (dayOfWeek !== SUNDAY && dayOfWeek !== SATURDAY) {
      businessDays += 1;
    }
  }
  return businessDays;
}
