import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { ACCOUNT_TYPES, type AccountType, type AccountTypeStatus } from "./account-types";
import { BANK_PROFILE_CRITERIA, type BankProfileCriterion } from "./criteria";
import {
  compareBanks,
  DEFAULT_CANDIDATE_COUNT,
  DEFAULT_COMPARISON_SETTINGS,
  rankBankProfiles,
  type ScorableBankProfile,
} from "./scoring";
import {
  CRITERION_WEIGHT_MAX,
  hasActiveCriterion,
  type CriteriaWeights,
  type WeightLevels,
} from "./weights";

const entryArb = fc.oneof(
  fc.record({
    status: fc.constant("scored" as const),
    score: fc.integer({ min: 0, max: 100 }),
    reviewedAt: fc.constantFrom("2026-03-01", "2026-09-09", "2026-10-02"),
  }),
  fc.record({
    status: fc.constant("insufficient-evidence" as const),
    reviewedAt: fc.constantFrom("2026-03-01", "2026-09-09", "2026-10-02"),
  }),
);

const criteriaArb = fc.record(
  Object.fromEntries(BANK_PROFILE_CRITERIA.map((criterion) => [criterion, entryArb])) as Record<
    BankProfileCriterion,
    typeof entryArb
  >,
);

const accountTypeStatusArb = fc.constantFrom<AccountTypeStatus>(
  "offered",
  "not-offered",
  "not-found",
);

const accountTypesArb = fc.record(
  Object.fromEntries(ACCOUNT_TYPES.map((type) => [type, accountTypeStatusArb])) as Record<
    AccountType,
    typeof accountTypeStatusArb
  >,
);

const profilesArb = fc
  .array(fc.tuple(criteriaArb, accountTypesArb), { minLength: 1, maxLength: 13 })
  .map((all) =>
    all.map(([criteria, accountTypes], index): ScorableBankProfile => ({
      institutionId: `bank-${String(index)}`,
      criteria,
      accountTypes,
    })),
  );

const weightsArb = fc
  .record(
    Object.fromEntries(
      BANK_PROFILE_CRITERIA.map((criterion) => [
        criterion,
        fc.integer({ min: 0, max: CRITERION_WEIGHT_MAX }),
      ]),
    ) as Record<BankProfileCriterion, fc.Arbitrary<number>>,
  )
  .filter((weights: CriteriaWeights) => hasActiveCriterion(weights));

const criterionArb = fc.constantFrom(...BANK_PROFILE_CRITERIA);

const requirementLevelArb = fc.constantFrom("optional" as const, "required" as const);

const accountTypeFilterArb = fc.record({
  jointBanking: requirementLevelArb,
  jointOnly: fc.boolean(),
  jointInvestment: requirementLevelArb,
  mei: requirementLevelArb,
});

function scale(weights: CriteriaWeights, factor: number): CriteriaWeights {
  return Object.fromEntries(
    BANK_PROFILE_CRITERIA.map((criterion) => [criterion, weights[criterion] * factor]),
  ) as CriteriaWeights;
}

describe("bank scoring properties", () => {
  it("keeps every score an integer from 0 to 100", () => {
    fc.assert(
      fc.property(profilesArb, weightsArb, (profiles, weights) => {
        for (const { score } of rankBankProfiles(profiles, weights)) {
          if (score !== null) {
            expect(Number.isInteger(score)).toBe(true);
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
          }
        }
      }),
    );
  });

  it("normalises weights: scaling every weight by the same factor changes nothing", () => {
    fc.assert(
      fc.property(
        profilesArb,
        weightsArb,
        fc.integer({ min: 2, max: 50 }),
        (profiles, weights, factor) => {
          expect(rankBankProfiles(profiles, scale(weights, factor))).toEqual(
            rankBankProfiles(profiles, weights),
          );
        },
      ),
    );
  });

  it("removes a zero-weight criterion: changing its scores changes nothing", () => {
    fc.assert(
      fc.property(
        profilesArb,
        weightsArb,
        criterionArb,
        fc.integer({ min: 0, max: 100 }),
        (profiles, weights, criterion, newScore) => {
          fc.pre(BANK_PROFILE_CRITERIA.some((other) => other !== criterion && weights[other] > 0));
          const zeroed = { ...weights, [criterion]: 0 };
          const changed = profiles.map((profile) => ({
            ...profile,
            criteria: {
              ...profile.criteria,
              [criterion]: { status: "scored" as const, score: newScore, reviewedAt: "2026-03-01" },
            },
          }));
          const strip = (scores: ReturnType<typeof rankBankProfiles>) =>
            scores.map(({ institutionId, score, missingEvidence }) => ({
              institutionId,
              score,
              missingEvidence,
            }));

          expect(strip(rankBankProfiles(changed, zeroed))).toEqual(
            strip(rankBankProfiles(profiles, zeroed)),
          );
        },
      ),
    );
  });

  it("keeps ties stable: identical profiles stay in input order", () => {
    fc.assert(
      fc.property(
        criteriaArb,
        accountTypesArb,
        fc.integer({ min: 2, max: 6 }),
        weightsArb,
        (criteria, accountTypes, copies, weights) => {
          const profiles = Array.from({ length: copies }, (_, index) => ({
            institutionId: `twin-${String(index)}`,
            criteria,
            accountTypes,
          }));

          expect(rankBankProfiles(profiles, weights).map((score) => score.institutionId)).toEqual(
            profiles.map((profile) => profile.institutionId),
          );
        },
      ),
    );
  });

  it("does not depend on input order except between ties", () => {
    fc.assert(
      fc.property(profilesArb, weightsArb, (profiles, weights) => {
        const forward = rankBankProfiles(profiles, weights).map((score) => score.score);
        const backward = rankBankProfiles([...profiles].reverse(), weights).map(
          (score) => score.score,
        );

        expect(backward).toEqual(forward);
      }),
    );
  });

  it(`never offers an institution the household already uses, and offers at most ${String(DEFAULT_CANDIDATE_COUNT)}`, () => {
    fc.assert(
      fc.property(
        profilesArb,
        weightsArb,
        fc.array(fc.nat({ max: 12 })),
        (profiles, weights, picks) => {
          const currentInstitutionIds = picks.map((index) => `bank-${String(index)}`);
          const levels = weights as unknown as WeightLevels;
          const { candidates } = compareBanks({
            profiles,
            levels,
            currentInstitutionIds,
            settings: DEFAULT_COMPARISON_SETTINGS,
          });

          expect(candidates.length).toBeLessThanOrEqual(DEFAULT_CANDIDATE_COUNT);
          for (const candidate of candidates) {
            expect(currentInstitutionIds).not.toContain(candidate.institutionId);
            expect(candidate.score).not.toBeNull();
            for (const item of [...candidate.pros, ...candidate.cons]) {
              expect(weights[item.criterion]).toBeGreaterThan(0);
              expect(item.difference).toBe(item.candidateScore - item.baselineScore);
            }
          }
        },
      ),
    );
  });

  // ADR-0006 amendment 2026-10-16: whichever account-type filter the
  // household sets, a candidate never misses one of the requirements it
  // implies.
  it("never yields a candidate that misses an account-type requirement", () => {
    fc.assert(
      fc.property(
        profilesArb,
        weightsArb,
        accountTypeFilterArb,
        (profiles, weights, accountTypeFilter) => {
          const levels = weights as unknown as WeightLevels;
          const { candidates } = compareBanks({
            profiles,
            levels,
            currentInstitutionIds: [],
            settings: { ...DEFAULT_COMPARISON_SETTINGS, candidateCount: 13, accountTypeFilter },
          });

          for (const candidate of candidates) {
            const profile = profiles.find((p) => p.institutionId === candidate.institutionId);
            if (accountTypeFilter.jointBanking === "required") {
              if (accountTypeFilter.jointOnly) {
                expect(profile?.accountTypes.joint).toBe("offered");
              } else {
                expect(
                  profile?.accountTypes.joint === "offered" ||
                    profile?.accountTypes.shared === "offered",
                ).toBe(true);
              }
            }
            if (accountTypeFilter.jointInvestment === "required") {
              expect(profile?.accountTypes.jointInvestment).toBe("offered");
            }
            if (accountTypeFilter.mei === "required") {
              expect(profile?.accountTypes.mei).toBe("offered");
            }
          }
        },
      ),
    );
  });
});
