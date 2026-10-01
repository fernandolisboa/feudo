import { describe, expect, it } from "vitest";

import { describeFreshness, freshnessLabel, STALE_AFTER_MS } from "./freshness";

const SAO_PAULO = "America/Sao_Paulo";

describe("describeFreshness", () => {
  it("reads a sync earlier the same household day as today", () => {
    const freshness = describeFreshness(
      new Date("2026-10-01T09:10:00Z"),
      new Date("2026-10-01T18:00:00Z"),
      SAO_PAULO,
    );

    expect(freshness).toEqual({ day: "today", date: "01/10/2026", time: "06:10", stale: false });
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

  it("calls data stale only once it is more than 48 hours old", () => {
    const syncedAt = new Date("2026-09-29T09:00:00Z");

    expect(
      describeFreshness(syncedAt, new Date(syncedAt.getTime() + STALE_AFTER_MS), SAO_PAULO).stale,
    ).toBe(false);
    expect(
      describeFreshness(syncedAt, new Date(syncedAt.getTime() + STALE_AFTER_MS + 1), SAO_PAULO)
        .stale,
    ).toBe(true);
  });
});
