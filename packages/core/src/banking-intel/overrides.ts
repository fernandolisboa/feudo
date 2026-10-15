import type { BankProfileCriterion } from "./criteria";
import type { ScorableBankProfile } from "./scoring";

export type CriterionScoreOverride = {
  institutionId: string;
  criterion: BankProfileCriterion;
  score: number;
};

// A household's own score for one criterion of one bank (ADR-0006,
// 2026-10-14) replaces the reference score in that household's comparison
// only; the reference review date stays, because it still dates the
// reference the override sits on, and the override's own date lives with
// the household's row.
export function applyScoreOverrides(
  profiles: readonly ScorableBankProfile[],
  overrides: readonly CriterionScoreOverride[],
): ScorableBankProfile[] {
  return profiles.map((profile) => {
    const own = overrides.filter((override) => override.institutionId === profile.institutionId);
    if (own.length === 0) return profile;
    const criteria = { ...profile.criteria };
    for (const override of own) {
      criteria[override.criterion] = {
        status: "scored",
        score: override.score,
        reviewedAt: criteria[override.criterion].reviewedAt,
      };
    }
    return { ...profile, criteria };
  });
}

// An override records the reference review date it was made against; a
// later reference review is news the household should be offered, never
// applied over its own value.
export function referenceRevisedSinceOverride(
  referenceReviewedAt: string,
  overrideBaseReviewedAt: string,
): boolean {
  return referenceReviewedAt > overrideBaseReviewedAt;
}
