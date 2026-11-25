import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { isSameAmount, sameAmountGapCentavos } from "./same-amount";

const amountArb = fc.record({
  amountCentavos: fc.oneof(
    fc.integer({ min: -2000, max: 2000 }),
    fc.integer({ min: -1_000_000_00, max: 1_000_000_00 }),
  ),
  currency: fc.constantFrom("BRL", "USD"),
});

const nearbyPairArb = fc
  .tuple(amountArb, fc.integer({ min: -15, max: 15 }), fc.boolean())
  .map(([a, delta, flip]) => ({
    a,
    b: {
      amountCentavos: (Math.abs(a.amountCentavos) + delta) * (flip ? -1 : 1),
      currency: a.currency,
    },
  }));

describe("same amount property tests", () => {
  it("is reflexive", () => {
    fc.assert(
      fc.property(amountArb, (a) => {
        expect(sameAmountGapCentavos(a, a)).toBe(0);
      }),
    );
  });

  it("is symmetric", () => {
    fc.assert(
      fc.property(nearbyPairArb, ({ a, b }) => {
        expect(sameAmountGapCentavos(a, b)).toBe(sameAmountGapCentavos(b, a));
      }),
    );
  });

  it("is never true across currencies", () => {
    fc.assert(
      fc.property(nearbyPairArb, ({ a, b }) => {
        expect(isSameAmount(a, { ...b, currency: a.currency === "BRL" ? "USD" : "BRL" })).toBe(
          false,
        );
      }),
    );
  });

  it("is never true more than 10 centavos or more than 1% of the larger amount apart", () => {
    fc.assert(
      fc.property(nearbyPairArb, ({ a, b }) => {
        const diff = Math.abs(Math.abs(a.amountCentavos) - Math.abs(b.amountCentavos));
        const larger = Math.max(Math.abs(a.amountCentavos), Math.abs(b.amountCentavos));
        expect(isSameAmount(a, b)).toBe(diff <= 10 && diff * 100 <= larger);
        if (diff > 10) {
          expect(sameAmountGapCentavos(a, b)).toBeNull();
        }
      }),
    );
  });
});
