import { describe, expect, it } from "vitest";

import { padDayRange } from "./pairing-window";

describe("padDayRange", () => {
  it("extends both ends of the range by the given number of calendar days", () => {
    expect(padDayRange({ from: "2026-09-01", to: "2026-09-30" }, 7)).toEqual({
      from: "2026-08-25",
      to: "2026-10-07",
    });
  });

  it("crosses a year boundary", () => {
    expect(padDayRange({ from: "2026-12-28", to: "2026-12-31" }, 7)).toEqual({
      from: "2026-12-21",
      to: "2027-01-07",
    });
  });

  it("does nothing when padded by zero days", () => {
    expect(padDayRange({ from: "2026-09-01", to: "2026-09-30" }, 0)).toEqual({
      from: "2026-09-01",
      to: "2026-09-30",
    });
  });
});
