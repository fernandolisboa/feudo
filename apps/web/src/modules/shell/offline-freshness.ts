import { localDateOf, shiftIsoDate } from "@feudo/core";

import { formatIsoDate } from "@/lib/format-date";
import { interpolate } from "@/lib/interpolate";

import { t } from "./strings";

// "Today" and "yesterday" are the household's calendar days (DESIGN.md
// freshness format), so the label matches the sync freshness on the screens.
export function lastUpdatedLabel(at: Date, now: Date, timeZone: string): string {
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(at);
  const day = localDateOf(at, timeZone);
  const today = localDateOf(now, timeZone);
  const when =
    day === today
      ? interpolate(t.offline.today, "{time}", time)
      : day === shiftIsoDate(today, -1)
        ? interpolate(t.offline.yesterday, "{time}", time)
        : `${formatIsoDate(day)}, ${time}`;
  return interpolate(t.offline.lastUpdated, "{when}", when);
}
