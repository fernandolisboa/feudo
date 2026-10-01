import { localDateOf, shiftIsoDate } from "@feudo/core";

import { formatIsoDate } from "@/lib/format-date";
import { interpolate } from "@/lib/interpolate";

import { t } from "./strings";

export const STALE_AFTER_MS = 48 * 60 * 60 * 1000;

export type Freshness = {
  day: "today" | "yesterday" | "earlier";
  date: string;
  time: string;
};

function formatTime(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(instant);
}

// "Today" and "yesterday" are the household's own calendar days, not UTC's:
// a 23:30 read in São Paulo is still today there while UTC has moved on.
export function describeFreshness(syncedAt: Date, now: Date, timeZone: string): Freshness {
  const syncedDay = localDateOf(syncedAt, timeZone);
  const today = localDateOf(now, timeZone);
  const day =
    syncedDay === today ? "today" : syncedDay === shiftIsoDate(today, -1) ? "yesterday" : "earlier";
  return {
    day,
    date: formatIsoDate(syncedDay),
    time: formatTime(syncedAt, timeZone),
  };
}

// Stale is a fact about the connection's last successful read, not the
// account's own stamp: an account the provider stops listing (a fully
// redeemed position) keeps its old stamp forever, and no sync could ever
// clear a warning keyed on it. A connection that never synced falls back to
// the account's stamp.
export function isStale(
  account: { syncedAt: Date; connectionSyncedAt: Date | null },
  now: Date,
): boolean {
  const lastRead = account.connectionSyncedAt ?? account.syncedAt;
  return now.getTime() - lastRead.getTime() > STALE_AFTER_MS;
}

export function freshnessLabel(freshness: Freshness): string {
  switch (freshness.day) {
    case "today":
      return interpolate(t.freshness.today, "{time}", freshness.time);
    case "yesterday":
      return interpolate(t.freshness.yesterday, "{time}", freshness.time);
    case "earlier":
      return `${freshness.date}, ${freshness.time}`;
  }
}
