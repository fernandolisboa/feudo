import { describe, expect, it } from "vitest";

import { describeFreshness, freshnessLabel, isStale, STALE_AFTER_MS } from "./freshness";

const SAO_PAULO = "America/Sao_Paulo";

describe("describeFreshness", () => {
  it("reads a sync earlier the same household day as today", () => {
    const freshness = describeFreshness(
      new Date("2026-10-01T09:10:00Z"),
      new Date("2026-10-01T18:00:00Z"),
      SAO_PAULO,
    );

    expect(freshness).toEqual({ day: "today", date: "01/10/2026", time: "06:10" });
    expect(freshnessLabel(freshness)).toBe("hoje, 06:10");
  });

  it("uses the household's calendar day, not UTC's, around midnight", () => {
    const lateEvening = new Date("2026-10-02T02:30:00Z");

    expect(describeFreshness(lateEvening, new Date("2026-10-02T02:45:00Z"), SAO_PAULO).day).toBe(
      "today",
    );
    expect(describeFreshness(lateEvening, new Date("2026-10-02T03:05:00Z"), SAO_PAULO).day).toBe(
      "yesterday",
    );
  });

  it("reads the previous household day as yesterday", () => {
    const freshness = describeFreshness(
      new Date("2026-09-30T22:15:00Z"),
      new Date("2026-10-01T12:00:00Z"),
      SAO_PAULO,
    );

    expect(freshnessLabel(freshness)).toBe("ontem, 19:15");
  });

  it("shows the date for anything older than yesterday", () => {
    const freshness = describeFreshness(
      new Date("2026-09-28T09:10:00Z"),
      new Date("2026-10-01T12:00:00Z"),
      SAO_PAULO,
    );

    expect(freshness.day).toBe("earlier");
    expect(freshnessLabel(freshness)).toBe("28/09/2026, 06:10");
  });
});

describe("isStale", () => {
  const lastRead = new Date("2026-09-29T09:00:00Z");

  it("calls data stale only once the connection's last read is more than 48 hours old", () => {
    const account = { syncedAt: lastRead, connectionSyncedAt: lastRead };

    expect(isStale(account, new Date(lastRead.getTime() + STALE_AFTER_MS))).toBe(false);
    expect(isStale(account, new Date(lastRead.getTime() + STALE_AFTER_MS + 1))).toBe(true);
  });

  it("does not flag an account the provider stopped listing while its connection keeps syncing", () => {
    const account = {
      syncedAt: new Date("2026-09-01T09:00:00Z"),
      connectionSyncedAt: new Date("2026-10-01T09:00:00Z"),
    };

    expect(isStale(account, new Date("2026-10-01T15:00:00Z"))).toBe(false);
  });

  it("falls back to the account's own stamp when the connection has none", () => {
    const account = { syncedAt: lastRead, connectionSyncedAt: null };

    expect(isStale(account, new Date(lastRead.getTime() + STALE_AFTER_MS + 1))).toBe(true);
  });
});
