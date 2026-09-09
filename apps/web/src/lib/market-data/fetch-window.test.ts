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

  it("caps the window at 10 years even when the last stored date is older", () => {
    const now = new Date("2026-09-09T12:00:00Z");
    expect(computeFetchWindow(now, "2010-01-01")).toEqual({
      fromISODate: "2016-09-09",
      toISODate: "2026-09-09",
    });
  });
});
