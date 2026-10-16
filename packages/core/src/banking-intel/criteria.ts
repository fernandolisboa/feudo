// Every criterion reads "higher is better for the household": a lock-in score
// of 100 means the institution is the easiest to leave.
export const BANK_PROFILE_CRITERIA = [
  "cardBenefits",
  "investmentAccess",
  "appQuality",
  "security",
  "fees",
  "lockIn",
  "publicReviews",
] as const;
export type BankProfileCriterion = (typeof BANK_PROFILE_CRITERIA)[number];

export const BANK_PROFILE_SCORE_MIN = 0;
export const BANK_PROFILE_SCORE_MAX = 100;
