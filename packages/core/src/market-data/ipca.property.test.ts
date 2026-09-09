import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { accumulate12MonthIpca } from "./ipca";

const realisticMonthlyRatePpm = fc.integer({ min: -20_000, max: 30_000 });
const twelveMonthlyRates = fc.array(realisticMonthlyRatePpm, { minLength: 12, maxLength: 12 });

describe("accumulate12MonthIpca monotonicity", () => {
  it("never decreases when one monthly rate increases, holding the others fixed", () => {
    fc.assert(
      fc.property(
        twelveMonthlyRates,
        fc.nat({ max: 11 }),
        realisticMonthlyRatePpm,
        (monthlyRates, index, delta) => {
          const higherMonthlyRates = monthlyRates.map((rate, i) =>
            i === index ? rate + Math.abs(delta) : rate,
          );
          expect(accumulate12MonthIpca(higherMonthlyRates)).toBeGreaterThanOrEqual(
            accumulate12MonthIpca(monthlyRates),
          );
        },
      ),
    );
  });
});
