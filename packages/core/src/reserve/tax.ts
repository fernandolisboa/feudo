import { DAY_MS, isoDateToUtcMidnight } from "../ledger/year-month";
import type { ReserveProduct } from "./products";

// Law 11,033/2004, art. 1: income tax on fixed income by holding period, in
// calendar days from the application.
export const REGRESSIVE_INCOME_TAX_BRACKETS = [
  { maxHoldingDays: 180, basisPoints: 2250 },
  { maxHoldingDays: 360, basisPoints: 2000 },
  { maxHoldingDays: 720, basisPoints: 1750 },
  { maxHoldingDays: Number.POSITIVE_INFINITY, basisPoints: 1500 },
] as const;

export const WORST_INCOME_TAX_BASIS_POINTS = 2250;

export type PositionTax =
  | { kind: "none" }
  | { kind: "exempt" }
  | { kind: "unknown" }
  | { kind: "bracket"; basisPoints: number; holdingDays: number }
  | { kind: "acquisition_date_unknown"; basisPoints: number };

export function regressiveBracketBasisPoints(holdingDays: number): number {
  const bracket = REGRESSIVE_INCOME_TAX_BRACKETS.find(
    (entry) => holdingDays <= entry.maxHoldingDays,
  );
  return bracket?.basisPoints ?? WORST_INCOME_TAX_BASIS_POINTS;
}

// ADR-0009: the bracket the household would pay if it redeemed today, or the
// worst one when the provider gave no acquisition date. An acquisition date
// after `today` (a provider clock ahead of ours) counts as held zero days.
export function positionTax(
  rule: ReserveProduct["tax"],
  acquisitionDate: string | null,
  today: string,
): PositionTax {
  switch (rule) {
    case "none":
      return { kind: "none" };
    case "exempt":
      return { kind: "exempt" };
    case "unknown":
      return { kind: "unknown" };
    case "regressive": {
      if (acquisitionDate === null) {
        return { kind: "acquisition_date_unknown", basisPoints: WORST_INCOME_TAX_BASIS_POINTS };
      }
      const holdingDays = Math.max(
        0,
        (isoDateToUtcMidnight(today) - isoDateToUtcMidnight(acquisitionDate)) / DAY_MS,
      );
      return {
        kind: "bracket",
        basisPoints: regressiveBracketBasisPoints(holdingDays),
        holdingDays,
      };
    }
  }
}

export function taxBasisPoints(tax: PositionTax): number {
  switch (tax.kind) {
    case "none":
    case "exempt":
    case "unknown":
      return 0;
    case "bracket":
    case "acquisition_date_unknown":
      return tax.basisPoints;
  }
}
