import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { BANK_PROFILE_CRITERIA, type BankProfileCriterion } from "./criteria";
import { applyScoreOverrides, referenceRevisedSinceOverride } from "./overrides";
import { DEFAULT_COMPARISON_SETTINGS, compareBanks, type ScorableBankProfile } from "./scoring";
import type { WeightLevels } from "./weights";

function profile(
  institutionId: string,
  scores: Partial<Record<BankProfileCriterion, number | null>>,
): ScorableBankProfile {
  return {
    institutionId,
    criteria: Object.fromEntries(
      BANK_PROFILE_CRITERIA.map((criterion) => {
        const score = scores[criterion] ?? null;
        return [
          criterion,
          score === null
            ? { status: "insufficient-evidence", reviewedAt: "2026-09-09" }
            : { status: "scored", score, reviewedAt: "2026-09-09" },
        ];
      }),
    ) as ScorableBankProfile["criteria"],
  };
}

const nubank = profile("nubank", { fees: 100, jointBanking: 65 });
const itau = profile("itau", { fees: 40, jointBanking: 100 });

describe("applyScoreOverrides", () => {
  it("replaces the overridden criterion's score and keeps the reference review date", () => {
    const [overridden] = applyScoreOverrides(
      [nubank],
      [{ institutionId: "nubank", criterion: "jointBanking", score: 30 }],
    );
    expect(overridden?.criteria.jointBanking).toEqual({
      status: "scored",
      score: 30,
      reviewedAt: "2026-09-09",
    });
    expect(overridden?.criteria.fees).toBe(nubank.criteria.fees);
  });

  it("scores a criterion the reference marks as insufficient evidence", () => {
    const [overridden] = applyScoreOverrides(
      [nubank],
      [{ institutionId: "nubank", criterion: "security", score: 70 }],
    );
    expect(overridden?.criteria.security).toEqual({
      status: "scored",
      score: 70,
      reviewedAt: "2026-09-09",
    });
  });

  it("leaves other institutions untouched and ignores overrides for unknown ones", () => {
    const result = applyScoreOverrides(
      [nubank, itau],
      [
        { institutionId: "nubank", criterion: "fees", score: 10 },
        { institutionId: "gone", criterion: "fees", score: 10 },
      ],
    );
    expect(result).toHaveLength(2);
    expect(result[1]).toBe(itau);
  });

  it("changes the household's comparison", () => {
    const levels: WeightLevels = {
      ...Object.fromEntries(BANK_PROFILE_CRITERIA.map((criterion) => [criterion, 0])),
      fees: 5,
    } as WeightLevels;
    const before = compareBanks({
      profiles: [nubank, itau],
      levels,
      currentInstitutionIds: [],
      settings: DEFAULT_COMPARISON_SETTINGS,
    });
    const after = compareBanks({
      profiles: applyScoreOverrides(
        [nubank, itau],
        [{ institutionId: "nubank", criterion: "fees", score: 10 }],
      ),
      levels,
      currentInstitutionIds: [],
      settings: DEFAULT_COMPARISON_SETTINGS,
    });
    expect(before.reviewed[0]?.institutionId).toBe("nubank");
    expect(after.reviewed[0]?.institutionId).toBe("itau");
  });

  it("is the identity without overrides and pins every overridden score", () => {
    const scoreArb = fc.integer({ min: 0, max: 100 });
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            institutionId: fc.constantFrom("nubank", "itau"),
            criterion: fc.constantFrom(...BANK_PROFILE_CRITERIA),
            score: scoreArb,
          }),
          { maxLength: 6 },
        ),
        (overrides) => {
          expect(applyScoreOverrides([nubank, itau], [])).toEqual([nubank, itau]);
          const result = applyScoreOverrides([nubank, itau], overrides);
          const last = new Map<string, number>(
            overrides.map((o) => [`${o.institutionId}:${o.criterion}`, o.score] as const),
          );
          for (const bank of result) {
            for (const criterion of BANK_PROFILE_CRITERIA) {
              const pinned = last.get(`${bank.institutionId}:${criterion}`);
              const entry = bank.criteria[criterion];
              if (pinned !== undefined) {
                expect(entry).toMatchObject({ status: "scored", score: pinned });
              }
            }
          }
        },
      ),
    );
  });
});

describe("referenceRevisedSinceOverride", () => {
  it("is true only when the reference was reviewed after the version the override was made on", () => {
    expect(referenceRevisedSinceOverride("2026-11-01", "2026-09-09")).toBe(true);
    expect(referenceRevisedSinceOverride("2026-09-09", "2026-09-09")).toBe(false);
    expect(referenceRevisedSinceOverride("2026-08-01", "2026-09-09")).toBe(false);
  });
});
