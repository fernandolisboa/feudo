import { describe, expect, it } from "vitest";

import { computeFetchWindow } from "./fetch-window";

describe("computeFetchWindow", () => {
  it("starts 24 months before now when there is no stored date", () => {
    const now = new Date("2026-09-09T12:00:00Z");
    expect(computeFetchWindow(now, undefined)).toEqual({
      fromISODate: "2024-09-09",
      toISODate: "2026-09-09",
    });
  });

  it("starts from the last stored date when one exists", () => {
    const now = new Date("2026-09-09T12:00:00Z");
    expect(computeFetchWindow(now, "2026-08-15")).toEqual({
      fromISODate: "2026-08-15",
      toISODate: "2026-09-09",
    });
  });

  it("caps the window one day short of 10 years even when the last stored date is older", () => {
    const now = new Date("2026-09-09T12:00:00Z");
    expect(computeFetchWindow(now, "2010-01-01")).toEqual({
      fromISODate: "2016-09-10",
      toISODate: "2026-09-09",
    });
  });

  it("never starts the window exactly 10 years before now, even across a leap year", () => {
    const now = new Date("2028-09-09T12:00:00Z");
    const window = computeFetchWindow(now, "2000-01-01");
    const exactlyTenYearsBefore = new Date("2018-09-09T00:00:00.000Z");
    expect(new Date(`${window.fromISODate}T00:00:00.000Z`).getTime()).toBeGreaterThan(
      exactlyTenYearsBefore.getTime(),
    );
  });

  it("clamps the first-run lookback from a leap day to the target month's last day", () => {
    const now = new Date("2024-02-29T12:00:00Z");
    expect(computeFetchWindow(now, undefined).fromISODate).toBe("2022-02-28");
  });
});
