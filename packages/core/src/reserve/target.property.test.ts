import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { AverageFixedCost } from "../ledger/dashboard";
import { parseYearMonth, shiftYearMonth, type YearMonth } from "../ledger/year-month";
import { computeReserveTarget } from "./target";
import { MAX_RESERVE_MULTIPLE, MIN_RESERVE_MULTIPLE } from "./constants";

const MONTH = parseYearMonth("2026-06");

function monthsUsedArb(count: number): YearMonth[] {
  return Array.from({ length: count }, (_, index) => shiftYearMonth(MONTH, -(index + 1)));
}

const averageArb: fc.Arbitrary<AverageFixedCost> = fc
  .record({
    averageCentavos: fc.integer({ min: 0, max: 1_000_000_00 }),
    monthsUsedCount: fc.integer({ min: 0, max: 6 }),
  })
  .map(({ averageCentavos, monthsUsedCount }) => ({
    averageCentavos,
    monthsUsed: monthsUsedArb(monthsUsedCount),
    isEstimate: monthsUsedCount < 3,
  }));

const multipleArb = fc.integer({ min: MIN_RESERVE_MULTIPLE, max: MAX_RESERVE_MULTIPLE });

describe("computeReserveTarget property tests", () => {
  it("is exactly the average fixed cost times the multiple", () => {
    fc.assert(
      fc.property(averageArb, multipleArb, (average, multiple) => {
        const result = computeReserveTarget(average, multiple);
        expect(result.targetCentavos).toBe(average.averageCentavos * multiple);
      }),
    );
  });

  it("is monotonic (non-decreasing) in the multiple for a non-negative average", () => {
    fc.assert(
      fc.property(averageArb, multipleArb, multipleArb, (average, a, b) => {
        const low = Math.min(a, b);
        const high = Math.max(a, b);
        const lowTarget = computeReserveTarget(average, low).targetCentavos;
        const highTarget = computeReserveTarget(average, high).targetCentavos;
        expect(highTarget).toBeGreaterThanOrEqual(lowTarget);
      }),
    );
  });

  it("flags an estimate exactly when fewer than three months were used, never at six", () => {
    fc.assert(
      fc.property(averageArb, multipleArb, (average, multiple) => {
        const result = computeReserveTarget(average, multiple);
        expect(result.isEstimate).toBe(average.monthsUsed.length < 3);
        if (average.monthsUsed.length === 6) {
          expect(result.isEstimate).toBe(false);
        }
      }),
    );
  });

  it("rejects every multiple outside the 3..12 range", () => {
    fc.assert(
      fc.property(
        averageArb,
        fc
          .integer()
          .filter((value) => value < MIN_RESERVE_MULTIPLE || value > MAX_RESERVE_MULTIPLE),
        (average, multiple) => {
          expect(() => computeReserveTarget(average, multiple)).toThrow();
        },
      ),
    );
  });
});
