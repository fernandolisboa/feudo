import { describe, expect, it } from "vitest";

import {
  InvalidIsoDateError,
  InvalidYearMonthError,
  calendarDaysBetween,
  formatYearMonth,
  isoDateToUtcMidnight,
  isYearMonth,
  padDayRange,
  parseYearMonth,
  shiftIsoDate,
  shiftYearMonth,
  yearMonthDayRange,
  yearMonthOf,
} from "./year-month";

const INVALID_ISO_DATES = ["2026-9-28", "2026/09/28", "not-a-date", "", "2026-02-31", "2026-13-01"];

describe("parseYearMonth", () => {
  it("accepts a zero-padded YYYY-MM", () => {
    expect(parseYearMonth("2026-09")).toBe("2026-09");
  });

  it.each(["2026-9", "2026-13", "2026-00", "202609", "2026-09-01", ""])("rejects %j", (value) => {
    expect(() => parseYearMonth(value)).toThrow(InvalidYearMonthError);
  });
});

describe("isYearMonth", () => {
  it("agrees with parseYearMonth without throwing", () => {
    expect(isYearMonth("2026-09")).toBe(true);
    expect(isYearMonth("2026-9")).toBe(false);
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
  it("formats in Brazilian Portuguese", () => {
    expect(formatYearMonth("2026-09")).toBe("setembro de 2026");
    expect(formatYearMonth("2027-01")).toBe("janeiro de 2027");
  });
});

describe("shiftIsoDate", () => {
  it("moves forward and backward across month and year boundaries", () => {
    expect(shiftIsoDate("2026-09-28", 3)).toBe("2026-10-01");
    expect(shiftIsoDate("2026-01-01", -1)).toBe("2025-12-31");
    expect(shiftIsoDate("2026-09-28", 0)).toBe("2026-09-28");
  });

  it.each(INVALID_ISO_DATES)("throws InvalidIsoDateError for %j", (value) => {
    expect(() => shiftIsoDate(value, 1)).toThrow(InvalidIsoDateError);
  });
});

describe("isoDateToUtcMidnight", () => {
  it("round-trips through toISOString for a real calendar day", () => {
    const time = isoDateToUtcMidnight("2026-09-28");
    expect(new Date(time).toISOString().slice(0, 10)).toBe("2026-09-28");
  });

  it.each(INVALID_ISO_DATES)(
    "throws InvalidIsoDateError for %j instead of rolling over to a nearby real date",
    (value) => {
      expect(() => isoDateToUtcMidnight(value)).toThrow(InvalidIsoDateError);
    },
  );
});

describe("calendarDaysBetween", () => {
  it("is symmetric and counts whole days", () => {
    expect(calendarDaysBetween("2026-09-25", "2026-09-29")).toBe(4);
    expect(calendarDaysBetween("2026-09-29", "2026-09-25")).toBe(4);
    expect(calendarDaysBetween("2026-09-25", "2026-09-25")).toBe(0);
  });
});

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
