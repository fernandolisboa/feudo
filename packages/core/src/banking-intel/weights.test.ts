import { describe, expect, it } from "vitest";

import { BANK_PROFILE_CRITERIA } from "./criteria";
import {
  assertScorableWeights,
  CRITERION_WEIGHT_MAX,
  CRITERION_WEIGHT_MIN,
  DEFAULT_CRITERIA_WEIGHTS,
  InvalidCriteriaWeightsError,
  isValidCriterionWeight,
  resolveCriteriaWeights,
} from "./weights";

const ALL_ZERO = Object.fromEntries(
  BANK_PROFILE_CRITERIA.map((criterion) => [criterion, 0]),
) as Record<(typeof BANK_PROFILE_CRITERIA)[number], number>;

describe("criteria weights", () => {
  it("ships a valid default for every criterion", () => {
    expect(Object.keys(DEFAULT_CRITERIA_WEIGHTS).sort()).toEqual([...BANK_PROFILE_CRITERIA].sort());
    expect(() => {
      assertScorableWeights(DEFAULT_CRITERIA_WEIGHTS);
    }).not.toThrow();
  });

  it("accepts integers from the minimum to the maximum only", () => {
    expect(isValidCriterionWeight(CRITERION_WEIGHT_MIN)).toBe(true);
    expect(isValidCriterionWeight(CRITERION_WEIGHT_MAX)).toBe(true);
    expect(isValidCriterionWeight(-1)).toBe(false);
    expect(isValidCriterionWeight(CRITERION_WEIGHT_MAX + 1)).toBe(false);
    expect(isValidCriterionWeight(2.5)).toBe(false);
    expect(isValidCriterionWeight(Number.NaN)).toBe(false);
  });

  it("refuses a set where every weight is zero", () => {
    expect(() => {
      assertScorableWeights(ALL_ZERO);
    }).toThrow(InvalidCriteriaWeightsError);
  });

  it("scores with any non-negative integer weights, since scoring normalises them", () => {
    expect(() => {
      assertScorableWeights({ ...DEFAULT_CRITERIA_WEIGHTS, fees: 50 });
    }).not.toThrow();
  });

  it("refuses a negative or fractional weight", () => {
    expect(() => {
      assertScorableWeights({ ...DEFAULT_CRITERIA_WEIGHTS, fees: -1 });
    }).toThrow(/fees is -1/);
    expect(() => {
      assertScorableWeights({ ...DEFAULT_CRITERIA_WEIGHTS, lockIn: 1.5 });
    }).toThrow(/lockIn is 1.5/);
  });

  it("fills criteria the household never set with the product default", () => {
    expect(resolveCriteriaWeights({ fees: 0, lockIn: 5 })).toEqual({
      ...DEFAULT_CRITERIA_WEIGHTS,
      fees: 0,
      lockIn: 5,
    });
  });

  it("replaces an invalid stored weight with the default", () => {
    expect(resolveCriteriaWeights({ fees: 7, security: -2 })).toEqual(DEFAULT_CRITERIA_WEIGHTS);
  });

  it("falls back to the defaults when the stored set leaves nothing to weigh", () => {
    expect(resolveCriteriaWeights(ALL_ZERO)).toEqual(DEFAULT_CRITERIA_WEIGHTS);
  });
});
