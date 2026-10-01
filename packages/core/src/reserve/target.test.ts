import { describe, expect, it } from "vitest";

import type { AverageFixedCost } from "../ledger/dashboard";
import { NonIntegerAmountError } from "../money/money";
import { parseYearMonth, shiftYearMonth } from "../ledger/year-month";
import { computeReserveTarget, InvalidReserveMultipleError } from "./target";

const MONTH = parseYearMonth("2026-06");

function average(overrides: Partial<AverageFixedCost> = {}): AverageFixedCost {
  return {
    averageCentavos: 100000,
    monthsUsed: [shiftYearMonth(MONTH, -1)],
    isEstimate: false,
    ...overrides,
  };
}

describe("computeReserveTarget", () => {
  it("multiplies the average fixed cost by the multiple", () => {
    const result = computeReserveTarget(average({ averageCentavos: 90000 }), 6);
    expect(result).toEqual({
      targetCentavos: 540000,
      multiple: 6,
      averageFixedCostCentavos: 90000,
      monthsUsedCount: 1,
      isEstimate: false,
    });
  });

  it("carries the estimate flag and months-used count from the average", () => {
    const result = computeReserveTarget(
      average({
        monthsUsed: [shiftYearMonth(MONTH, -2), shiftYearMonth(MONTH, -1)],
        isEstimate: true,
      }),
      6,
    );
    expect(result.isEstimate).toBe(true);
    expect(result.monthsUsedCount).toBe(2);
  });

  it("floors the target at zero when the average fixed cost is negative", () => {
    const result = computeReserveTarget(average({ averageCentavos: -50000 }), 6);
    expect(result.targetCentavos).toBe(0);
    expect(result.averageFixedCostCentavos).toBe(-50000);
  });

  it("accepts the minimum multiple (3)", () => {
    expect(() => computeReserveTarget(average(), 3)).not.toThrow();
  });

  it("accepts the maximum multiple (12)", () => {
    expect(() => computeReserveTarget(average(), 12)).not.toThrow();
  });

  it("rejects a multiple below the minimum", () => {
    expect(() => computeReserveTarget(average(), 2)).toThrow(InvalidReserveMultipleError);
  });

  it("rejects a multiple above the maximum", () => {
    expect(() => computeReserveTarget(average(), 13)).toThrow(InvalidReserveMultipleError);
  });

  it("rejects a non-integer multiple", () => {
    expect(() => computeReserveTarget(average(), 6.5)).toThrow(InvalidReserveMultipleError);
  });

  it("rejects a non-integer average fixed cost, like money.ts guards its own amounts", () => {
    expect(() => computeReserveTarget(average({ averageCentavos: 1000.5 }), 6)).toThrow(
      NonIntegerAmountError,
    );
  });
});
