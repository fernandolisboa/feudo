import { describe, expect, it } from "vitest";

import {
  InvalidYearMonthError,
  formatYearMonth,
  parseYearMonth,
  shiftYearMonth,
  yearMonthDayRange,
  yearMonthOf,
} from "./year-month";

describe("parseYearMonth", () => {
  it("accepts a zero-padded YYYY-MM", () => {
    expect(parseYearMonth("2026-09")).toBe("2026-09");
  });

  it.each(["2026-9", "2026-13", "2026-00", "202609", "2026-09-01", ""])("rejects %j", (value) => {
    expect(() => parseYearMonth(value)).toThrow(InvalidYearMonthError);
  });
});

describe("yearMonthOf", () => {
  it("reads the month in the given time zone, not in UTC", () => {
    const instant = new Date("2026-10-01T01:30:00.000Z");

    expect(yearMonthOf(instant, "UTC")).toBe("2026-10");
    expect(yearMonthOf(instant, "America/Sao_Paulo")).toBe("2026-09");
  });
});

describe("shiftYearMonth", () => {
  it("moves forward and backward across year boundaries", () => {
    expect(shiftYearMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftYearMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftYearMonth("2026-09", -12)).toBe("2025-09");
    expect(shiftYearMonth("2026-09", 0)).toBe("2026-09");
  });
});

describe("yearMonthDayRange", () => {
  it("spans the first to the last calendar day, leap years included", () => {
    expect(yearMonthDayRange("2026-09")).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(yearMonthDayRange("2028-02")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(yearMonthDayRange("2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });
});

describe("formatYearMonth", () => {
  it("formats in Brazilian Portuguese by default", () => {
    expect(formatYearMonth("2026-09")).toBe("setembro de 2026");
  });

  it("formats in another locale when asked", () => {
    expect(formatYearMonth("2026-09", "en-US")).toBe("September 2026");
  });
});
