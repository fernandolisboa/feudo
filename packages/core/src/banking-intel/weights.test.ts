import { describe, expect, it } from "vitest";

import { BANK_PROFILE_CRITERIA } from "./criteria";
import {
  assertScorableWeights,
  criterionShares,
  CRITERION_WEIGHT_MAX,
  CRITERION_WEIGHT_MIN,
  DEFAULT_WEIGHT_LEVELS,
  effectiveWeights,
  hasActiveCriterion,
  hasActiveLevel,
  InvalidCriteriaWeightsError,
  isValidCriterionWeight,
  isValidWeightLevel,
  resolveCriteriaWeights,
  type CriteriaWeights,
  type WeightLevels,
} from "./weights";

const ALL_ZERO = Object.fromEntries(
  BANK_PROFILE_CRITERIA.map((criterion) => [criterion, 0]),
) as Record<(typeof BANK_PROFILE_CRITERIA)[number], number>;

const ALL_ZERO_LEVELS = ALL_ZERO as unknown as WeightLevels;

describe("criteria weight levels", () => {
  it("ships a valid default for every criterion, jointBanking essential", () => {
    expect(Object.keys(DEFAULT_WEIGHT_LEVELS).sort()).toEqual([...BANK_PROFILE_CRITERIA].sort());
    expect(DEFAULT_WEIGHT_LEVELS.jointBanking).toBe("essential");
    expect(hasActiveLevel(DEFAULT_WEIGHT_LEVELS)).toBe(true);
  });

  it("accepts integers from the minimum to the maximum only", () => {
    expect(isValidCriterionWeight(CRITERION_WEIGHT_MIN)).toBe(true);
    expect(isValidCriterionWeight(CRITERION_WEIGHT_MAX)).toBe(true);
    expect(isValidCriterionWeight(-1)).toBe(false);
    expect(isValidCriterionWeight(CRITERION_WEIGHT_MAX + 1)).toBe(false);
    expect(isValidCriterionWeight(2.5)).toBe(false);
    expect(isValidCriterionWeight(Number.NaN)).toBe(false);
  });

  it("recognises a numeric level or essential/required, and nothing else", () => {
    expect(isValidWeightLevel(0)).toBe(true);
    expect(isValidWeightLevel(5)).toBe(true);
    expect(isValidWeightLevel("essential")).toBe(true);
    expect(isValidWeightLevel("required")).toBe(true);
    expect(isValidWeightLevel(6)).toBe(false);
    expect(isValidWeightLevel(-1)).toBe(false);
    expect(isValidWeightLevel("obligatory")).toBe(false);
    expect(isValidWeightLevel(null)).toBe(false);
    expect(isValidWeightLevel(undefined)).toBe(false);
  });

  it("counts a level active when some numeric weight is above zero or any level is essential/required", () => {
    expect(hasActiveLevel(ALL_ZERO_LEVELS)).toBe(false);
    expect(hasActiveLevel({ ...ALL_ZERO_LEVELS, fees: 1 })).toBe(true);
    expect(hasActiveLevel({ ...ALL_ZERO_LEVELS, jointBanking: "essential" })).toBe(true);
    expect(hasActiveLevel({ ...ALL_ZERO_LEVELS, jointBanking: "required" })).toBe(true);
  });

  it("fills a criterion the household never set with the product default", () => {
    expect(resolveCriteriaWeights({ fees: 0, lockIn: 5 })).toEqual({
      ...DEFAULT_WEIGHT_LEVELS,
      fees: 0,
      lockIn: 5,
    });
  });

  it("replaces an invalid stored level with the default", () => {
    expect(resolveCriteriaWeights({ fees: 7, security: -2, jointBanking: "obligatory" })).toEqual(
      DEFAULT_WEIGHT_LEVELS,
    );
  });

  it("accepts a stored essential or required level", () => {
    expect(resolveCriteriaWeights({ jointBanking: "required", fees: 1 })).toEqual({
      ...DEFAULT_WEIGHT_LEVELS,
      jointBanking: "required",
      fees: 1,
    });
  });

  it("falls back to the defaults when the stored set leaves nothing to weigh", () => {
    expect(resolveCriteriaWeights(ALL_ZERO)).toEqual(DEFAULT_WEIGHT_LEVELS);
  });
});

describe("effectiveWeights", () => {
  it("leaves numeric weights unchanged when nothing is essential or required", () => {
    const levels: WeightLevels = { ...ALL_ZERO_LEVELS, fees: 5, lockIn: 2 };

    expect(effectiveWeights(levels)).toEqual({ ...ALL_ZERO, fees: 5, lockIn: 2 });
  });

  it("scales numeric weights by the essential-or-required count and gives each of those the numeric sum", () => {
    const levels: WeightLevels = {
      ...ALL_ZERO_LEVELS,
      fees: 2,
      lockIn: 3,
      jointBanking: "essential",
    };

    // E = 1, N = 5: numeric weights scale ×1, jointBanking gets N = 5.
    expect(effectiveWeights(levels)).toEqual({
      ...ALL_ZERO,
      fees: 2,
      lockIn: 3,
      jointBanking: 5,
    });
  });

  it("scales numeric weights by the count of essential-or-required criteria", () => {
    const levels: WeightLevels = {
      ...ALL_ZERO_LEVELS,
      fees: 2,
      lockIn: 3,
      jointBanking: "essential",
      security: "required",
    };

    // E = 2, N = 5: numeric weights scale ×2, each of the two gets N = 5.
    expect(effectiveWeights(levels)).toEqual({
      ...ALL_ZERO,
      fees: 4,
      lockIn: 6,
      jointBanking: 5,
      security: 5,
    });
  });

  it("gives every essential-or-required criterion weight 1 when nothing numeric counts", () => {
    const levels: WeightLevels = {
      ...ALL_ZERO_LEVELS,
      jointBanking: "essential",
      security: "required",
    };

    expect(effectiveWeights(levels)).toEqual({
      ...ALL_ZERO,
      jointBanking: 1,
      security: 1,
    });
  });
});

describe("criterionShares", () => {
  function shareOf(weights: CriteriaWeights, criterion: keyof CriteriaWeights): number {
    return criterionShares(weights)[criterion];
  }

  it("gives every criterion's percentage of the note, summing to 100", () => {
    const weights: CriteriaWeights = { ...ALL_ZERO, fees: 1, lockIn: 1, security: 2 };

    const shares = criterionShares(weights);

    expect(shares.fees).toBe(25);
    expect(shares.lockIn).toBe(25);
    expect(shares.security).toBe(50);
    expect(Object.values(shares).reduce((sum, share) => sum + share, 0)).toBe(100);
  });

  it("gives every criterion zero when nothing counts", () => {
    expect(criterionShares(ALL_ZERO)).toEqual(ALL_ZERO);
  });

  it("gives essential-or-required exactly half the note when mixed with numeric weights", () => {
    const weights = effectiveWeights({
      ...ALL_ZERO_LEVELS,
      fees: 2,
      lockIn: 3,
      jointBanking: "essential",
    });

    expect(shareOf(weights, "jointBanking")).toBe(50);
  });
});

describe("scorable weights (effective, numeric)", () => {
  it("ships a valid default once resolved to effective weights", () => {
    expect(() => {
      assertScorableWeights(effectiveWeights(DEFAULT_WEIGHT_LEVELS));
    }).not.toThrow();
  });

  it("refuses a set where every weight is zero", () => {
    expect(() => {
      assertScorableWeights(ALL_ZERO);
    }).toThrow(InvalidCriteriaWeightsError);
  });

  it("scores with any non-negative integer weights, since scoring normalises them", () => {
    expect(() => {
      assertScorableWeights({ ...ALL_ZERO, fees: 50 });
    }).not.toThrow();
  });

  it("refuses a negative or fractional weight", () => {
    expect(() => {
      assertScorableWeights({ ...ALL_ZERO, fees: -1 });
    }).toThrow(/fees is -1/);
    expect(() => {
      assertScorableWeights({ ...ALL_ZERO, lockIn: 1.5 });
    }).toThrow(/lockIn is 1.5/);
  });

  it("counts a plain numeric set active only above zero", () => {
    expect(hasActiveCriterion(ALL_ZERO)).toBe(false);
    expect(hasActiveCriterion({ ...ALL_ZERO, fees: 1 })).toBe(true);
  });
});
