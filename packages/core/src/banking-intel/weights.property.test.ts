import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { BANK_PROFILE_CRITERIA, type BankProfileCriterion } from "./criteria";
import {
  criterionShares,
  CRITERION_WEIGHT_MAX,
  hasActiveLevel,
  type WeightLevels,
} from "./weights";

const numericLevelArb = fc.integer({ min: 0, max: CRITERION_WEIGHT_MAX });

const levelsArb: fc.Arbitrary<WeightLevels> = fc
  .record(
    Object.fromEntries(
      BANK_PROFILE_CRITERIA.map((criterion) => [criterion, numericLevelArb]),
    ) as Record<BankProfileCriterion, typeof numericLevelArb>,
  )
  .map((levels) => levels as unknown as WeightLevels);

describe("weight level properties", () => {
  it("always lets criterionShares add up to 100 when something counts", () => {
    fc.assert(
      fc.property(levelsArb, (levels) => {
        fc.pre(hasActiveLevel(levels));

        const shares = criterionShares(levels);

        expect(Object.values(shares).reduce((sum, share) => sum + share, 0)).toBe(100);
      }),
    );
  });

  it("gives every criterion a non-negative integer share", () => {
    fc.assert(
      fc.property(levelsArb, (levels) => {
        fc.pre(hasActiveLevel(levels));

        const shares = criterionShares(levels);

        for (const criterion of BANK_PROFILE_CRITERIA) {
          expect(Number.isInteger(shares[criterion])).toBe(true);
          expect(shares[criterion]).toBeGreaterThanOrEqual(0);
        }
      }),
    );
  });

  it("gives a zero-weight criterion no share", () => {
    fc.assert(
      fc.property(levelsArb, (levels) => {
        fc.pre(hasActiveLevel(levels));

        const shares = criterionShares(levels);

        for (const criterion of BANK_PROFILE_CRITERIA) {
          if (levels[criterion] === 0) expect(shares[criterion]).toBe(0);
        }
      }),
    );
  });
});
