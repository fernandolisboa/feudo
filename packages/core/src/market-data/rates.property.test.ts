import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { annualizeDailyRate, dailyizeAnnualRate } from "./rates";

const realisticDailyRatePpm = fc.integer({ min: -2_000, max: 5_000 });
const realisticAnnualRatePpm = fc.integer({ min: -100_000, max: 500_000 });
const roundTripTolerancePpm = 500;

describe("annualizeDailyRate / dailyizeAnnualRate round trip", () => {
  it("recovers the daily rate within tolerance after annualizing and dailyizing it back", () => {
    fc.assert(
      fc.property(realisticDailyRatePpm, (dailyRatePpm) => {
        const roundTripped = dailyizeAnnualRate(annualizeDailyRate(dailyRatePpm));
        expect(Math.abs(roundTripped - dailyRatePpm)).toBeLessThanOrEqual(roundTripTolerancePpm);
      }),
    );
  });

  it("recovers the annual rate within tolerance after dailyizing and annualizing it back", () => {
    fc.assert(
      fc.property(realisticAnnualRatePpm, (annualRatePpm) => {
        const roundTripped = annualizeDailyRate(dailyizeAnnualRate(annualRatePpm));
        expect(Math.abs(roundTripped - annualRatePpm)).toBeLessThanOrEqual(roundTripTolerancePpm);
      }),
    );
  });
});

describe("annualizeDailyRate monotonicity", () => {
  it("never decreases when the daily rate increases", () => {
    fc.assert(
      fc.property(realisticDailyRatePpm, realisticDailyRatePpm, (a, b) => {
        const [lower, higher] = a <= b ? [a, b] : [b, a];
        expect(annualizeDailyRate(lower)).toBeLessThanOrEqual(annualizeDailyRate(higher));
      }),
    );
  });
});

describe("dailyizeAnnualRate monotonicity", () => {
  it("never decreases when the annual rate increases", () => {
    fc.assert(
      fc.property(realisticAnnualRatePpm, realisticAnnualRatePpm, (a, b) => {
        const [lower, higher] = a <= b ? [a, b] : [b, a];
        expect(dailyizeAnnualRate(lower)).toBeLessThanOrEqual(dailyizeAnnualRate(higher));
      }),
    );
  });
});
