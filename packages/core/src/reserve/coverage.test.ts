import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { computeReserveCoverage } from "./coverage";

describe("computeReserveCoverage", () => {
  it("states coverage in reais, share of the target and months of fixed cost", () => {
    expect(
      computeReserveCoverage({
        reservePositions: [
          { balanceCentavos: 1_025_075, currency: "BRL" },
          { balanceCentavos: 1_500_040, currency: "BRL" },
        ],
        targetCentavos: 5_400_000,
        averageFixedCostCentavos: 900_000,
      }),
    ).toEqual({ currentCentavos: 2_525_115, percentBasisPoints: 4676, monthsTenths: 28 });
  });

  it("leaves foreign-currency positions out of the total", () => {
    expect(
      computeReserveCoverage({
        reservePositions: [
          { balanceCentavos: 100_000, currency: "BRL" },
          { balanceCentavos: 900_000, currency: "USD" },
        ],
        targetCentavos: 1_000_000,
        averageFixedCostCentavos: 100_000,
      }),
    ).toEqual({ currentCentavos: 100_000, percentBasisPoints: 1000, monthsTenths: 10 });
  });

  it("reports no share or months when there is nothing to divide by", () => {
    expect(
      computeReserveCoverage({
        reservePositions: [{ balanceCentavos: 100_000, currency: "BRL" }],
        targetCentavos: 0,
        averageFixedCostCentavos: -5_000,
      }),
    ).toEqual({ currentCentavos: 100_000, percentBasisPoints: null, monthsTenths: null });
  });

  it("is zero with no reserve positions", () => {
    expect(
      computeReserveCoverage({
        reservePositions: [],
        targetCentavos: 1_000_000,
        averageFixedCostCentavos: 100_000,
      }),
    ).toEqual({ currentCentavos: 0, percentBasisPoints: 0, monthsTenths: 0 });
  });

  it("never claims more coverage than the balances hold", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 100_000_000 }), { maxLength: 8 }),
        fc.integer({ min: 1, max: 1_000_000_000 }),
        fc.integer({ min: 1, max: 100_000_000 }),
        (balances, target, average) => {
          const coverage = computeReserveCoverage({
            reservePositions: balances.map((balanceCentavos) => ({
              balanceCentavos,
              currency: "BRL",
            })),
            targetCentavos: target,
            averageFixedCostCentavos: average,
          });
          expect((coverage.percentBasisPoints ?? 0) * target).toBeLessThanOrEqual(
            coverage.currentCentavos * 10_000,
          );
          expect((coverage.monthsTenths ?? 0) * average).toBeLessThanOrEqual(
            coverage.currentCentavos * 10,
          );
        },
      ),
    );
  });
});
