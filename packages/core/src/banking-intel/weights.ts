import { BANK_PROFILE_CRITERIA, type BankProfileCriterion } from "./criteria";

export const CRITERION_WEIGHT_MIN = 0;
export const CRITERION_WEIGHT_MAX = 5;

export type CriterionNumericWeight = 0 | 1 | 2 | 3 | 4 | 5;

// A household's weights (what it stores) and the weights scoring reads are
// the same shape since the essential/required levels were retired (ADR-0006
// amendment 2026-10-16): both are a plain 0-5 integer per criterion.
export type CriteriaWeights = Readonly<Record<BankProfileCriterion, number>>;
export type WeightLevels = CriteriaWeights;

export const DEFAULT_WEIGHT_LEVELS: WeightLevels = {
  cardBenefits: 2,
  investmentAccess: 3,
  appQuality: 3,
  security: 4,
  fees: 5,
  lockIn: 4,
  publicReviews: 4,
};

export class InvalidCriteriaWeightsError extends Error {
  constructor(reason: string) {
    super(`invalid criteria weights: ${reason}`);
    this.name = "InvalidCriteriaWeightsError";
  }
}

export function isValidCriterionWeight(weight: unknown): weight is CriterionNumericWeight {
  return (
    typeof weight === "number" &&
    Number.isInteger(weight) &&
    weight >= CRITERION_WEIGHT_MIN &&
    weight <= CRITERION_WEIGHT_MAX
  );
}

// Scoring normalises weights, so it only needs non-negative integers with at
// least one above zero; the 0 to 5 range is what a household can store per
// criterion.
export function hasActiveCriterion(weights: CriteriaWeights): boolean {
  return BANK_PROFILE_CRITERIA.some((criterion) => weights[criterion] > 0);
}

export function hasActiveLevel(levels: WeightLevels): boolean {
  return hasActiveCriterion(levels);
}

export function assertScorableWeights(weights: CriteriaWeights): void {
  for (const criterion of BANK_PROFILE_CRITERIA) {
    const weight = weights[criterion];
    if (!Number.isSafeInteger(weight) || weight < 0) {
      throw new InvalidCriteriaWeightsError(`${criterion} is ${String(weight)}`);
    }
  }
  if (!hasActiveCriterion(weights)) {
    throw new InvalidCriteriaWeightsError("every weight is zero");
  }
}

// Stored levels are household data that may predate a criterion dropped
// from the product (jointBanking, retired 2026-10-16) or a criterion that
// never existed; an unknown key is silently ignored, since only
// BANK_PROFILE_CRITERIA is ever read. A level stored under the retired
// "essential" or "required" special weights reads as 5 (the top of the
// numeric scale), same as any other invalid level falls back to the
// product default when it isn't 5-worthy on its own.
export function resolveCriteriaWeights(
  stored: Partial<Record<BankProfileCriterion, unknown>>,
): WeightLevels {
  const resolved = Object.fromEntries(
    BANK_PROFILE_CRITERIA.map((criterion) => {
      const level = stored[criterion];
      if (level === "essential" || level === "required") return [criterion, 5];
      return [criterion, isValidCriterionWeight(level) ? level : DEFAULT_WEIGHT_LEVELS[criterion]];
    }),
  ) as Record<BankProfileCriterion, number>;
  return hasActiveLevel(resolved) ? resolved : DEFAULT_WEIGHT_LEVELS;
}

// Largest-remainder apportionment so the shares always add up to 100, used
// live in the UI next to each level and quoted in analysis facts. Ignores
// per-bank evidence gaps: a share is the weight's share of the note, not of
// what a particular bank was actually scored on.
export function criterionShares(
  weights: CriteriaWeights,
): Readonly<Record<BankProfileCriterion, number>> {
  const total = BANK_PROFILE_CRITERIA.reduce((sum, criterion) => sum + weights[criterion], 0);
  if (total <= 0) {
    return Object.fromEntries(BANK_PROFILE_CRITERIA.map((criterion) => [criterion, 0])) as Record<
      BankProfileCriterion,
      number
    >;
  }

  const entries = BANK_PROFILE_CRITERIA.map((criterion) => {
    const exact = (weights[criterion] * 100) / total;
    const floor = Math.floor(exact);
    return { criterion, floor, remainder: exact - floor };
  });
  const shares = new Map(entries.map((entry) => [entry.criterion, entry.floor]));
  let remaining = 100 - entries.reduce((sum, entry) => sum + entry.floor, 0);
  for (const entry of [...entries].sort((a, b) => b.remainder - a.remainder)) {
    if (remaining <= 0) break;
    shares.set(entry.criterion, (shares.get(entry.criterion) ?? 0) + 1);
    remaining -= 1;
  }
  return Object.fromEntries(
    BANK_PROFILE_CRITERIA.map((criterion) => [criterion, shares.get(criterion) ?? 0]),
  ) as Record<BankProfileCriterion, number>;
}
