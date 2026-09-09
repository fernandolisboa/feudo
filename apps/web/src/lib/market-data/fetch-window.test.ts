import { describe, expect, it } from "vitest";

import { computeFetchWindow } from "./fetch-window";

describe("computeFetchWindow", () => {
  it("starts 24 months before now when there is no stored date", () => {
    const now = new Date("2026-09-09T12:00:00Z");
    expect(computeFetchWindow(now, undefined, "daily")).toEqual({
      fromISODate: "2024-09-09",
      toISODate: "2026-09-09",
    });
  });

  it("overlaps a few days before the last stored date for a daily series", () => {
    const now = new Date("2026-09-09T12:00:00Z");
    expect(computeFetchWindow(now, "2026-08-15", "daily")).toEqual({
      fromISODate: "2026-08-10",
      toISODate: "2026-09-09",
    });
  });

  it("overlaps one month before the last stored date for a monthly series", () => {
    const now = new Date("2026-09-09T12:00:00Z");
    expect(computeFetchWindow(now, "2026-08-15", "monthly")).toEqual({
      fromISODate: "2026-07-15",
      toISODate: "2026-09-09",
    });
  });

  it("caps the window one day short of 10 years even when the last stored date is older", () => {
    const now = new Date("2026-09-09T12:00:00Z");
    expect(computeFetchWindow(now, "2010-01-01", "daily")).toEqual({
      fromISODate: "2016-09-10",
      toISODate: "2026-09-09",
    });
  });

  it("never starts the window exactly 10 years before now, even across a leap year", () => {
    const now = new Date("2028-09-09T12:00:00Z");
    const window = computeFetchWindow(now, "2000-01-01", "daily");
    const exactlyTenYearsBefore = new Date("2018-09-09T00:00:00.000Z");
    expect(new Date(`${window.fromISODate}T00:00:00.000Z`).getTime()).toBeGreaterThan(
      exactlyTenYearsBefore.getTime(),
    );
  });

  it("caps the window strictly after the 10-year boundary when now is a leap day", () => {
    const now = new Date("2024-02-29T12:00:00Z");
    const window = computeFetchWindow(now, "2000-01-01", "daily");
    expect(window.fromISODate).toBe("2014-03-01");
    const tenYearsBefore = new Date("2014-02-28T00:00:00.000Z");
    expect(new Date(`${window.fromISODate}T00:00:00.000Z`).getTime()).toBeGreaterThan(
      tenYearsBefore.getTime(),
    );
  });

  it("clamps the first-run lookback from a leap day to the target month's last day", () => {
    const now = new Date("2024-02-29T12:00:00Z");
    expect(computeFetchWindow(now, undefined, "daily").fromISODate).toBe("2022-02-28");
  });

  it("clamps the monthly overlap when the last stored date has no equivalent day one month back", () => {
    const now = new Date("2024-04-05T12:00:00Z");
    expect(computeFetchWindow(now, "2024-03-31", "monthly").fromISODate).toBe("2024-02-29");
  });
});
