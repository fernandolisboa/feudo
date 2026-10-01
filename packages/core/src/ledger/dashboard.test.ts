import { describe, expect, it } from "vitest";
import {
  averageFixedCost,
  buildLedgerDashboard,
  dashboardMonthRange,
  type DashboardLine,
} from "./dashboard";
import { parseYearMonth, shiftYearMonth, type YearMonth } from "./year-month";

const MONTH = parseYearMonth("2026-06");

function line(overrides: Partial<DashboardLine> = {}): DashboardLine {
  return {
    month: MONTH,
    kind: "income",
    type: "credit",
    amountCentavos: 10000,
    categoryId: null,
    currency: "BRL",
    ...overrides,
  };
}

describe("buildLedgerDashboard totals", () => {
  it("adds income credits and subtracts income debits", () => {
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [
        line({ kind: "income", type: "credit", amountCentavos: 500000 }),
        line({ kind: "income", type: "debit", amountCentavos: 20000 }),
      ],
    });
    expect(result.totals.incomeCentavos).toBe(480000);
  });

  it("adds fixed and variable debits and subtracts refunds (credits)", () => {
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [
        line({ kind: "fixed", type: "debit", amountCentavos: 100000 }),
        line({ kind: "variable", type: "debit", amountCentavos: 30000 }),
        line({ kind: "variable", type: "credit", amountCentavos: 5000 }),
      ],
    });
    expect(result.totals.fixedCentavos).toBe(100000);
    expect(result.totals.variableCentavos).toBe(25000);
    expect(result.totals.spendingCentavos).toBe(125000);
  });

  it("excludes internal transfers and uncategorized lines from every total", () => {
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [
        line({ kind: "transfer", type: "debit", amountCentavos: 900000 }),
        line({ kind: null, type: "debit", amountCentavos: 40000 }),
      ],
    });
    expect(result.totals).toEqual({
      incomeCentavos: 0,
      fixedCentavos: 0,
      variableCentavos: 0,
      spendingCentavos: 0,
    });
  });

  it("ignores lines whose sign disagrees with type, reading direction from type only", () => {
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [line({ kind: "fixed", type: "debit", amountCentavos: -100000 })],
    });
    expect(result.totals.fixedCentavos).toBe(100000);
  });
});

describe("savingsRateBasisPoints", () => {
  it("is positive when spending is below income", () => {
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [
        line({ kind: "income", type: "credit", amountCentavos: 500000 }),
        line({ kind: "fixed", type: "debit", amountCentavos: 300000 }),
      ],
    });
    expect(result.savingsRateBasisPoints).toBe(4000);
  });

  it("is negative when spending exceeds income", () => {
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [
        line({ kind: "income", type: "credit", amountCentavos: 100000 }),
        line({ kind: "fixed", type: "debit", amountCentavos: 137000 }),
      ],
    });
    expect(result.savingsRateBasisPoints).toBe(-3700);
  });

  it("is null when income is zero", () => {
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [line({ kind: "fixed", type: "debit", amountCentavos: 1000 })],
    });
    expect(result.savingsRateBasisPoints).toBeNull();
  });

  it("is null when income is negative (net refunds)", () => {
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [line({ kind: "income", type: "debit", amountCentavos: 1000 })],
    });
    expect(result.savingsRateBasisPoints).toBeNull();
  });

  it("rounds an exact half basis point away from zero", () => {
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [
        line({ kind: "income", type: "credit", amountCentavos: 800 }),
        line({ kind: "fixed", type: "debit", amountCentavos: 401 }),
      ],
    });
    expect(result.savingsRateBasisPoints).toBe(4988);
  });
});

describe("spendingByCategory", () => {
  it("sums net spending per category for fixed and variable kinds only", () => {
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [
        line({ kind: "fixed", type: "debit", amountCentavos: 100000, categoryId: "housing" }),
        line({ kind: "variable", type: "debit", amountCentavos: 20000, categoryId: "food" }),
        line({ kind: "variable", type: "credit", amountCentavos: 5000, categoryId: "food" }),
      ],
    });
    expect(result.spendingByCategory).toEqual([
      { categoryId: "housing", spendingCentavos: 100000 },
      { categoryId: "food", spendingCentavos: 15000 },
    ]);
  });

  it("excludes income, transfer and uncategorized lines", () => {
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [
        line({ kind: "income", type: "credit", amountCentavos: 100000, categoryId: "income" }),
        line({ kind: "transfer", type: "debit", amountCentavos: 5000, categoryId: "transfers" }),
        line({ kind: "fixed", type: "debit", amountCentavos: 3000, categoryId: null }),
      ],
    });
    expect(result.spendingByCategory).toEqual([]);
  });

  it("drops categories whose net total is zero or negative", () => {
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [
        line({ kind: "variable", type: "debit", amountCentavos: 5000, categoryId: "food" }),
        line({ kind: "variable", type: "credit", amountCentavos: 5000, categoryId: "food" }),
        line({ kind: "variable", type: "credit", amountCentavos: 100, categoryId: "leisure" }),
      ],
    });
    expect(result.spendingByCategory).toEqual([]);
  });

  it("sorts by amount descending, ties broken by product category order", () => {
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [
        line({ kind: "variable", type: "debit", amountCentavos: 1000, categoryId: "leisure" }),
        line({ kind: "fixed", type: "debit", amountCentavos: 3000, categoryId: "housing" }),
        line({ kind: "variable", type: "debit", amountCentavos: 1000, categoryId: "food" }),
      ],
    });
    expect(result.spendingByCategory).toEqual([
      { categoryId: "housing", spendingCentavos: 3000 },
      { categoryId: "food", spendingCentavos: 1000 },
      { categoryId: "leisure", spendingCentavos: 1000 },
    ]);
  });
});

describe("series", () => {
  it("returns six points, oldest first, ending on the requested month", () => {
    const result = buildLedgerDashboard({ month: MONTH, lines: [] });
    expect(result.series.map((point) => point.month)).toEqual([
      shiftYearMonth(MONTH, -5),
      shiftYearMonth(MONTH, -4),
      shiftYearMonth(MONTH, -3),
      shiftYearMonth(MONTH, -2),
      shiftYearMonth(MONTH, -1),
      MONTH,
    ]);
  });

  it("reports zero for a month with no lines", () => {
    const result = buildLedgerDashboard({ month: MONTH, lines: [] });
    expect(
      result.series.every((point) => point.incomeCentavos === 0 && point.spendingCentavos === 0),
    ).toBe(true);
  });

  it("does not clamp a negative income or spending point", () => {
    const priorMonth = shiftYearMonth(MONTH, -1);
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [
        line({ month: priorMonth, kind: "income", type: "debit", amountCentavos: 5000 }),
        line({ month: priorMonth, kind: "variable", type: "credit", amountCentavos: 3000 }),
      ],
    });
    const point = result.series.find((entry) => entry.month === priorMonth);
    expect(point).toEqual({ month: priorMonth, incomeCentavos: -5000, spendingCentavos: -3000 });
  });

  it("attributes income and spending to their own month across the series", () => {
    const twoMonthsAgo = shiftYearMonth(MONTH, -2);
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [
        line({ month: twoMonthsAgo, kind: "income", type: "credit", amountCentavos: 200000 }),
        line({ month: MONTH, kind: "fixed", type: "debit", amountCentavos: 50000 }),
      ],
    });
    const olderPoint = result.series.find((entry) => entry.month === twoMonthsAgo);
    const currentPoint = result.series.find((entry) => entry.month === MONTH);
    expect(olderPoint).toEqual({
      month: twoMonthsAgo,
      incomeCentavos: 200000,
      spendingCentavos: 0,
    });
    expect(currentPoint).toEqual({ month: MONTH, incomeCentavos: 0, spendingCentavos: 50000 });
  });
});

describe("averageFixedCost", () => {
  function fixedLine(month: YearMonth, amountCentavos: number): DashboardLine {
    return line({ month, kind: "fixed", type: "debit", amountCentavos });
  }

  it("is null with no history at all in the window", () => {
    const result = buildLedgerDashboard({ month: MONTH, lines: [] });
    expect(result.averageFixedCost).toBeNull();
  });

  it("is an estimate with a single month of history", () => {
    const onlyMonth = shiftYearMonth(MONTH, -1);
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [fixedLine(onlyMonth, 90000)],
    });
    expect(result.averageFixedCost).toEqual({
      averageCentavos: 90000,
      monthsUsed: [onlyMonth],
      isEstimate: true,
    });
  });

  it("is an estimate with two months of history", () => {
    const m1 = shiftYearMonth(MONTH, -2);
    const m2 = shiftYearMonth(MONTH, -1);
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [fixedLine(m1, 90000), fixedLine(m2, 110000)],
    });
    expect(result.averageFixedCost).toEqual({
      averageCentavos: 100000,
      monthsUsed: [m1, m2],
      isEstimate: true,
    });
  });

  it("stops being an estimate at three months of history", () => {
    const m1 = shiftYearMonth(MONTH, -3);
    const m2 = shiftYearMonth(MONTH, -2);
    const m3 = shiftYearMonth(MONTH, -1);
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [fixedLine(m1, 90000), fixedLine(m2, 100000), fixedLine(m3, 110000)],
    });
    expect(result.averageFixedCost).toEqual({
      averageCentavos: 100000,
      monthsUsed: [m1, m2, m3],
      isEstimate: false,
    });
  });

  it("uses all six months of the window when every month has history", () => {
    const months = Array.from({ length: 6 }, (_, index) => shiftYearMonth(MONTH, index - 6));
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: months.map((month) => fixedLine(month, 60000)),
    });
    expect(result.averageFixedCost).toEqual({
      averageCentavos: 60000,
      monthsUsed: months,
      isEstimate: false,
    });
  });

  it("excludes a month with only uncategorized lines from monthsUsed, not a fully uncategorized month's silent zero", () => {
    const gapMonth = shiftYearMonth(MONTH, -2);
    const dataMonth = shiftYearMonth(MONTH, -1);
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [
        line({ month: gapMonth, kind: null, type: "debit", amountCentavos: 1000 }),
        fixedLine(dataMonth, 60000),
      ],
    });
    expect(result.averageFixedCost).toEqual({
      averageCentavos: 60000,
      monthsUsed: [dataMonth],
      isEstimate: true,
    });
  });

  it("excludes the requested month itself and months outside the window", () => {
    const tooOld = shiftYearMonth(MONTH, -7);
    const withinWindow = shiftYearMonth(MONTH, -1);
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [fixedLine(tooOld, 999999), fixedLine(withinWindow, 50000), fixedLine(MONTH, 777777)],
    });
    expect(result.averageFixedCost).toEqual({
      averageCentavos: 50000,
      monthsUsed: [withinWindow],
      isEstimate: true,
    });
  });
});

describe("averageFixedCost (public, with month breakdown)", () => {
  function fixedLine(month: YearMonth, amountCentavos: number): DashboardLine {
    return line({ month, kind: "fixed", type: "debit", amountCentavos });
  }

  it("names every window month, oldest first, whether or not it counted", () => {
    const withinWindow = shiftYearMonth(MONTH, -1);
    const result = averageFixedCost({ month: MONTH, lines: [fixedLine(withinWindow, 50000)] });
    expect(result.months.map((entry) => entry.month)).toEqual([
      shiftYearMonth(MONTH, -6),
      shiftYearMonth(MONTH, -5),
      shiftYearMonth(MONTH, -4),
      shiftYearMonth(MONTH, -3),
      shiftYearMonth(MONTH, -2),
      withinWindow,
    ]);
  });

  it("marks a month with nothing categorized as a gap (null), not a zero", () => {
    const gapMonth = shiftYearMonth(MONTH, -2);
    const dataMonth = shiftYearMonth(MONTH, -1);
    const result = averageFixedCost({
      month: MONTH,
      lines: [
        line({ month: gapMonth, kind: null, type: "debit", amountCentavos: 1000 }),
        fixedLine(dataMonth, 60000),
      ],
    });
    const gapEntry = result.months.find((entry) => entry.month === gapMonth);
    const dataEntry = result.months.find((entry) => entry.month === dataMonth);
    expect(gapEntry?.fixedCentavos).toBeNull();
    expect(dataEntry?.fixedCentavos).toBe(60000);
  });

  it("reports a categorized month with zero fixed spending as 0, not a gap", () => {
    const month = shiftYearMonth(MONTH, -1);
    const result = averageFixedCost({
      month: MONTH,
      lines: [line({ month, kind: "variable", type: "debit", amountCentavos: 5000 })],
    });
    const entry = result.months.find((item) => item.month === month);
    expect(entry?.fixedCentavos).toBe(0);
  });

  it("matches buildLedgerDashboard's averageFixedCost field exactly", () => {
    const m1 = shiftYearMonth(MONTH, -3);
    const m2 = shiftYearMonth(MONTH, -2);
    const m3 = shiftYearMonth(MONTH, -1);
    const lines = [fixedLine(m1, 90000), fixedLine(m2, 100000), fixedLine(m3, 110000)];
    expect(averageFixedCost({ month: MONTH, lines }).average).toEqual(
      buildLedgerDashboard({ month: MONTH, lines }).averageFixedCost,
    );
  });

  it("returns a null average with a fully-populated month breakdown when every month is a gap", () => {
    const result = averageFixedCost({ month: MONTH, lines: [] });
    expect(result.average).toBeNull();
    expect(result.months).toHaveLength(6);
    expect(result.months.every((entry) => entry.fixedCentavos === null)).toBe(true);
  });
});

describe("currency", () => {
  it("ignores lines in any currency other than the household's own", () => {
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [
        line({ kind: "income", type: "credit", amountCentavos: 500000, currency: "USD" }),
        line({ kind: "fixed", type: "debit", amountCentavos: 90000, currency: "USD" }),
        line({ kind: "income", type: "credit", amountCentavos: 100000, currency: "BRL" }),
      ],
    });
    expect(result.totals).toEqual({
      incomeCentavos: 100000,
      fixedCentavos: 0,
      variableCentavos: 0,
      spendingCentavos: 0,
    });
  });
});

describe("range handling", () => {
  it("ignores lines outside month-6..month", () => {
    const result = buildLedgerDashboard({
      month: MONTH,
      lines: [
        line({
          month: shiftYearMonth(MONTH, -7),
          kind: "income",
          type: "credit",
          amountCentavos: 500000,
        }),
        line({
          month: shiftYearMonth(MONTH, 1),
          kind: "income",
          type: "credit",
          amountCentavos: 500000,
        }),
      ],
    });
    expect(result.totals.incomeCentavos).toBe(0);
    expect(result.series.every((point) => point.incomeCentavos === 0)).toBe(true);
    expect(result.averageFixedCost).toBeNull();
  });
});

describe("dashboardMonthRange", () => {
  it("spans six months before the requested month up to the month itself", () => {
    expect(dashboardMonthRange(MONTH)).toEqual({
      from: shiftYearMonth(MONTH, -6),
      to: MONTH,
    });
  });
});
