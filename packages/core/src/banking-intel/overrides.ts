import type { AccountType, AccountTypeStatus } from "./account-types";
import type { BankProfileCriterion } from "./criteria";
import type { ScorableBankProfile } from "./scoring";

export type CriterionScoreOverride = {
  institutionId: string;
  criterion: BankProfileCriterion;
  score: number;
};

export type AccountTypeOverride = {
  institutionId: string;
  accountType: AccountType;
  offered: boolean;
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

// A household's own offered/not-offered call on one account type of one
// bank (ADR-0006 amendment 2026-10-16) replaces the reference status in
// that household's comparison only; reference account types the household
// never touched are passed through unchanged.
export function applyAccountTypeOverrides(
  profiles: readonly ScorableBankProfile[],
  overrides: readonly AccountTypeOverride[],
): ScorableBankProfile[] {
  return profiles.map((profile) => {
    const own = overrides.filter((override) => override.institutionId === profile.institutionId);
    if (own.length === 0) return profile;
    const accountTypes: Record<AccountType, AccountTypeStatus> = { ...profile.accountTypes };
    for (const override of own) {
      accountTypes[override.accountType] = override.offered ? "offered" : "not-offered";
    }
    return { ...profile, accountTypes };
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
