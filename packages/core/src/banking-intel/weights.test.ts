import { describe, expect, it } from "vitest";

import { BANK_PROFILE_CRITERIA } from "./criteria";
import {
  assertScorableWeights,
  criterionShares,
  CRITERION_WEIGHT_MAX,
  CRITERION_WEIGHT_MIN,
  DEFAULT_WEIGHT_LEVELS,
  hasActiveLevel,
  InvalidCriteriaWeightsError,
  isValidCriterionWeight,
  resolveCriteriaWeights,
  type WeightLevels,
} from "./weights";

const ALL_ZERO: WeightLevels = Object.fromEntries(
  BANK_PROFILE_CRITERIA.map((criterion) => [criterion, 0]),
) as WeightLevels;

describe("criteria weight levels", () => {
  it("ships a valid default for every criterion", () => {
    expect(Object.keys(DEFAULT_WEIGHT_LEVELS).sort()).toEqual([...BANK_PROFILE_CRITERIA].sort());
    expect(hasActiveLevel(DEFAULT_WEIGHT_LEVELS)).toBe(true);
  });

  it("accepts integers from the minimum to the maximum only", () => {
    expect(isValidCriterionWeight(CRITERION_WEIGHT_MIN)).toBe(true);
    expect(isValidCriterionWeight(CRITERION_WEIGHT_MAX)).toBe(true);
    expect(isValidCriterionWeight(-1)).toBe(false);
    expect(isValidCriterionWeight(CRITERION_WEIGHT_MAX + 1)).toBe(false);
    expect(isValidCriterionWeight(2.5)).toBe(false);
    expect(isValidCriterionWeight(Number.NaN)).toBe(false);
    expect(isValidCriterionWeight("essential")).toBe(false);
    expect(isValidCriterionWeight(null)).toBe(false);
    expect(isValidCriterionWeight(undefined)).toBe(false);
  });

  it("counts a level active only when some numeric weight is above zero", () => {
    expect(hasActiveLevel(ALL_ZERO)).toBe(false);
    expect(hasActiveLevel({ ...ALL_ZERO, fees: 1 })).toBe(true);
  });

  it("fills a criterion the household never set with the product default", () => {
    expect(resolveCriteriaWeights({ fees: 0, lockIn: 5 })).toEqual({
      ...DEFAULT_WEIGHT_LEVELS,
      fees: 0,
      lockIn: 5,
    });
  });

  it("replaces an invalid stored level with the default", () => {
    expect(resolveCriteriaWeights({ fees: 7, security: -2 })).toEqual(DEFAULT_WEIGHT_LEVELS);
  });

  it("maps a legacy essential or required level to 5, the top of the numeric scale", () => {
    expect(resolveCriteriaWeights({ fees: "essential", security: "required" })).toEqual({
      ...DEFAULT_WEIGHT_LEVELS,
      fees: 5,
      security: 5,
    });
  });

  it("ignores a stored key for a criterion the product no longer has, like jointBanking", () => {
    expect(
      resolveCriteriaWeights({ jointBanking: "required", fees: 1 } as Record<string, unknown>),
    ).toEqual({
      ...DEFAULT_WEIGHT_LEVELS,
      fees: 1,
    });
  });

  it("falls back to the defaults when the stored set leaves nothing to weigh", () => {
    expect(resolveCriteriaWeights(ALL_ZERO)).toEqual(DEFAULT_WEIGHT_LEVELS);
  });
});

describe("criterionShares", () => {
  function shareOf(weights: WeightLevels, criterion: keyof WeightLevels): number {
    return criterionShares(weights)[criterion];
  }

  it("gives every criterion's percentage of the note, summing to 100", () => {
    const weights: WeightLevels = { ...ALL_ZERO, fees: 1, lockIn: 1, security: 2 };

    const shares = criterionShares(weights);

    expect(shares.fees).toBe(25);
    expect(shares.lockIn).toBe(25);
    expect(shares.security).toBe(50);
    expect(Object.values(shares).reduce((sum, share) => sum + share, 0)).toBe(100);
  });

  it("gives every criterion zero when nothing counts", () => {
    expect(criterionShares(ALL_ZERO)).toEqual(ALL_ZERO);
  });

  it("gives a criterion weighted 5 among others at 1 its exact share", () => {
    const weights: WeightLevels = { ...ALL_ZERO, fees: 1, security: 5 };

    expect(shareOf(weights, "security")).toBe(83);
  });
});

describe("scorable weights", () => {
  it("ships a valid default", () => {
    expect(() => {
      assertScorableWeights(DEFAULT_WEIGHT_LEVELS);
    }).not.toThrow();
  });

  it("refuses a set where every weight is zero", () => {
    expect(() => {
      assertScorableWeights(ALL_ZERO);
    }).toThrow(InvalidCriteriaWeightsError);
  });

  it("refuses a negative or fractional weight", () => {
    expect(() => {
      assertScorableWeights({ ...ALL_ZERO, fees: -1 } as unknown as WeightLevels);
    }).toThrow(/fees is -1/);
    expect(() => {
      assertScorableWeights({ ...ALL_ZERO, lockIn: 1.5 } as unknown as WeightLevels);
    }).toThrow(/lockIn is 1.5/);
  });

  it("counts a plain numeric set active only above zero", () => {
    expect(hasActiveLevel(ALL_ZERO)).toBe(false);
    expect(hasActiveLevel({ ...ALL_ZERO, fees: 1 })).toBe(true);
  });
});
