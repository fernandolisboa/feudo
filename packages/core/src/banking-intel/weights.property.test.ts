import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { BANK_PROFILE_CRITERIA, type BankProfileCriterion } from "./criteria";
import {
  criterionShares,
  CRITERION_WEIGHT_MAX,
  effectiveWeights,
  hasActiveLevel,
  type CriterionWeightLevel,
  type WeightLevels,
} from "./weights";

const numericLevelArb = fc.integer({ min: 0, max: CRITERION_WEIGHT_MAX });
const criterionArb = fc.constantFrom(...BANK_PROFILE_CRITERIA);
const gateLevelArb = fc.constantFrom<CriterionWeightLevel>("essential", "required");

const numericLevelsArb: fc.Arbitrary<Record<BankProfileCriterion, number>> = fc.record(
  Object.fromEntries(
    BANK_PROFILE_CRITERIA.map((criterion) => [criterion, numericLevelArb]),
  ) as Record<BankProfileCriterion, typeof numericLevelArb>,
);

function withGates(
  numericLevels: Record<BankProfileCriterion, number>,
  gateCriteria: readonly BankProfileCriterion[],
  gateLevel: CriterionWeightLevel,
): WeightLevels {
  const base = numericLevels as unknown as WeightLevels;
  return gateCriteria.reduce((levels, criterion) => ({ ...levels, [criterion]: gateLevel }), base);
}

describe("weight level properties", () => {
  // ADR-0006, 2026-10-14: whichever single criterion the household marks
  // essential or required, it pulls exactly half the note once at least one
  // other criterion counts numerically, however it is split among the rest.
  it("gives a single essential or required criterion exactly half the note when mixed with numeric weights", () => {
    fc.assert(
      fc.property(
        numericLevelsArb,
        criterionArb,
        gateLevelArb,
        (numericLevels, gateCriterion, gateLevel) => {
          const levels = withGates(numericLevels, [gateCriterion], gateLevel);
          fc.pre(
            BANK_PROFILE_CRITERIA.some(
              (criterion) => criterion !== gateCriterion && numericLevels[criterion] > 0,
            ),
          );

          const shares = criterionShares(effectiveWeights(levels));

          expect(shares[gateCriterion]).toBe(50);
        },
      ),
    );
  });

  it("keeps every effective weight a non-negative integer", () => {
    fc.assert(
      fc.property(
        numericLevelsArb,
        fc.array(criterionArb, { maxLength: 3 }),
        gateLevelArb,
        (numericLevels, gateCriteria, gateLevel) => {
          const levels = withGates(numericLevels, gateCriteria, gateLevel);
          fc.pre(hasActiveLevel(levels));

          const weights = effectiveWeights(levels);

          for (const criterion of BANK_PROFILE_CRITERIA) {
            expect(Number.isInteger(weights[criterion])).toBe(true);
            expect(weights[criterion]).toBeGreaterThanOrEqual(0);
          }
        },
      ),
    );
  });

  it("always lets criterionShares add up to 100 when something counts", () => {
    fc.assert(
      fc.property(
        numericLevelsArb,
        fc.array(criterionArb, { maxLength: 3 }),
        gateLevelArb,
        (numericLevels, gateCriteria, gateLevel) => {
          const levels = withGates(numericLevels, gateCriteria, gateLevel);
          fc.pre(hasActiveLevel(levels));

          const shares = criterionShares(effectiveWeights(levels));

          expect(Object.values(shares).reduce((sum, share) => sum + share, 0)).toBe(100);
        },
      ),
    );
  });
});
