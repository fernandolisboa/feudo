import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { buildLedgerDashboard, type DashboardLine } from "./dashboard";
import {
  KINDS,
  PRODUCT_CATEGORY_IDS,
  type Kind,
  type ProductCategoryId,
} from "./categories/taxonomy";
import { parseYearMonth, shiftYearMonth } from "./year-month";

const MONTH = parseYearMonth("2026-06");

const monthOffsetArb = fc
  .integer({ min: -6, max: 0 })
  .map((offset) => shiftYearMonth(MONTH, offset));

const lineArb: fc.Arbitrary<DashboardLine> = fc.record({
  month: monthOffsetArb,
  kind: fc.constantFrom<Kind | null>(...KINDS, null),
  type: fc.constantFrom<"credit" | "debit">("credit", "debit"),
  amountCentavos: fc.integer({ min: 1, max: 1_000_000_00 }),
  categoryId: fc.constantFrom<ProductCategoryId | null>(...PRODUCT_CATEGORY_IDS, null),
});

function shuffle<T>(items: readonly T[], seed: number): T[] {
  const copy = [...items];
  let state = seed;
  for (let index = copy.length - 1; index > 0; index -= 1) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const swapIndex = state % (index + 1);
    const current = copy[index];
    const swapped = copy[swapIndex];
    if (current === undefined || swapped === undefined) continue;
    copy[index] = swapped;
    copy[swapIndex] = current;
  }
  return copy;
}

describe("buildLedgerDashboard property tests", () => {
  it("keeps spendingCentavos equal to fixedCentavos plus variableCentavos", () => {
    fc.assert(
      fc.property(fc.array(lineArb), (lines) => {
        const result = buildLedgerDashboard({ month: MONTH, lines });
        expect(result.totals.spendingCentavos).toBe(
          result.totals.fixedCentavos + result.totals.variableCentavos,
        );
      }),
    );
  });

  it("does not depend on the order lines are given in", () => {
    fc.assert(
      fc.property(fc.array(lineArb), fc.integer(), (lines, seed) => {
        const shuffled = shuffle(lines, seed);
        expect(buildLedgerDashboard({ month: MONTH, lines: shuffled })).toEqual(
          buildLedgerDashboard({ month: MONTH, lines }),
        );
      }),
    );
  });

  it("matches the series' last point to the month's own totals", () => {
    fc.assert(
      fc.property(fc.array(lineArb), (lines) => {
        const result = buildLedgerDashboard({ month: MONTH, lines });
        const lastPoint = result.series[result.series.length - 1];
        expect(lastPoint).toEqual({
          month: MONTH,
          incomeCentavos: result.totals.incomeCentavos,
          spendingCentavos: result.totals.spendingCentavos,
        });
      }),
    );
  });

  it("gives a savings rate whose sign matches income minus spending whenever income is positive", () => {
    fc.assert(
      fc.property(fc.array(lineArb), (lines) => {
        const result = buildLedgerDashboard({ month: MONTH, lines });
        const { incomeCentavos, spendingCentavos } = result.totals;
        if (incomeCentavos <= 0) {
          expect(result.savingsRateBasisPoints).toBeNull();
          return;
        }
        const net = incomeCentavos - spendingCentavos;
        if (net === 0) {
          expect(result.savingsRateBasisPoints).toBe(0);
        } else {
          expect(Math.sign(result.savingsRateBasisPoints as number)).toBe(Math.sign(net));
        }
      }),
    );
  });

  it("keeps the average fixed cost within the range of the months it uses", () => {
    fc.assert(
      fc.property(fc.array(lineArb), (lines) => {
        const result = buildLedgerDashboard({ month: MONTH, lines });
        if (result.averageFixedCost === null) return;

        const { monthsUsed, averageCentavos } = result.averageFixedCost;
        const monthlyFixed = monthsUsed.map((usedMonth) =>
          lines
            .filter((line) => line.month === usedMonth && line.kind === "fixed")
            .reduce(
              (total, line) =>
                total + (line.type === "debit" ? line.amountCentavos : -line.amountCentavos),
              0,
            ),
        );
        expect(averageCentavos).toBeGreaterThanOrEqual(Math.min(...monthlyFixed));
        expect(averageCentavos).toBeLessThanOrEqual(Math.max(...monthlyFixed));
      }),
    );
  });
});
