import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  positionTax,
  regressiveBracketBasisPoints,
  taxBasisPoints,
  WORST_INCOME_TAX_BASIS_POINTS,
} from "./tax";

describe("regressiveBracketBasisPoints", () => {
  it.each([
    [0, 2250],
    [180, 2250],
    [181, 2000],
    [360, 2000],
    [361, 1750],
    [720, 1750],
    [721, 1500],
    [5000, 1500],
  ])("taxes %i days held at %i basis points", (days, expected) => {
    expect(regressiveBracketBasisPoints(days)).toBe(expected);
  });

  it("never rises with a longer holding period", () => {
    fc.assert(
      fc.property(fc.nat({ max: 10_000 }), fc.nat({ max: 10_000 }), (a, b) => {
        const [short, long] = a <= b ? [a, b] : [b, a];
        expect(regressiveBracketBasisPoints(long)).toBeLessThanOrEqual(
          regressiveBracketBasisPoints(short),
        );
      }),
    );
  });
});

describe("positionTax", () => {
  it("uses the bracket for the real holding age today", () => {
    expect(positionTax("regressive", "2025-02-01", "2026-10-02")).toEqual({
      kind: "bracket",
      basisPoints: 1750,
      holdingDays: 608,
    });
  });

  it("falls back to the worst bracket when the acquisition date is unknown", () => {
    expect(positionTax("regressive", null, "2026-10-02")).toEqual({
      kind: "acquisition_date_unknown",
      basisPoints: WORST_INCOME_TAX_BASIS_POINTS,
    });
  });

  it("counts an acquisition date after today as held zero days", () => {
    expect(positionTax("regressive", "2026-10-05", "2026-10-02")).toEqual({
      kind: "bracket",
      basisPoints: 2250,
      holdingDays: 0,
    });
  });

  it("passes exempt, untaxed and unknown rules through", () => {
    expect(positionTax("exempt", null, "2026-10-02")).toEqual({ kind: "exempt" });
    expect(positionTax("none", null, "2026-10-02")).toEqual({ kind: "none" });
    expect(positionTax("unknown", "2020-01-01", "2026-10-02")).toEqual({ kind: "unknown" });
  });
});

describe("taxBasisPoints", () => {
  it("charges only bracketed positions", () => {
    expect(taxBasisPoints({ kind: "exempt" })).toBe(0);
    expect(taxBasisPoints({ kind: "none" })).toBe(0);
    expect(taxBasisPoints({ kind: "unknown" })).toBe(0);
    expect(taxBasisPoints({ kind: "bracket", basisPoints: 1500, holdingDays: 800 })).toBe(1500);
    expect(taxBasisPoints({ kind: "acquisition_date_unknown", basisPoints: 2250 })).toBe(2250);
  });
});
