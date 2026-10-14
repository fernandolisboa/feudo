import { BANK_PROFILE_CRITERIA, type BankProfileCriterion } from "./criteria";

export const CRITERION_WEIGHT_MIN = 0;
export const CRITERION_WEIGHT_MAX = 5;

export type CriterionNumericWeight = 0 | 1 | 2 | 3 | 4 | 5;
export type CriterionWeightLevel = CriterionNumericWeight | "essential" | "required";

// Effective, numeric weights ready for scoring (cross-multiplication-friendly
// integers): what a plain weight level resolves to once essential and
// required criteria have been folded in by effectiveWeights.
export type CriteriaWeights = Readonly<Record<BankProfileCriterion, number>>;

// What a household stores per criterion: a level from "doesn't count" to
// "very high", or one of the two special levels that double a criterion's
// pull on the note, essential and required; only required also demands a
// minimum score to be a candidate (scoring.ts) — essential is weight only.
export type WeightLevels = Readonly<Record<BankProfileCriterion, CriterionWeightLevel>>;

export const DEFAULT_WEIGHT_LEVELS: WeightLevels = {
  cardBenefits: 2,
  investmentAccess: 3,
  appQuality: 3,
  security: 4,
  fees: 5,
  lockIn: 4,
  publicReviews: 4,
  jointBanking: "essential",
};

export class InvalidCriteriaWeightsError extends Error {
  constructor(reason: string) {
    super(`invalid criteria weights: ${reason}`);
    this.name = "InvalidCriteriaWeightsError";
  }
}

export function isValidCriterionWeight(weight: number): boolean {
  return (
    Number.isInteger(weight) && weight >= CRITERION_WEIGHT_MIN && weight <= CRITERION_WEIGHT_MAX
  );
}

export function isValidWeightLevel(level: unknown): level is CriterionWeightLevel {
  if (level === "essential" || level === "required") return true;
  return typeof level === "number" && isValidCriterionWeight(level);
}

// Scoring normalises weights, so it only needs non-negative integers with at
// least one above zero; the 0 to 5 range is what a household can store per
// numeric level.
export function hasActiveCriterion(weights: CriteriaWeights): boolean {
  return BANK_PROFILE_CRITERIA.some((criterion) => weights[criterion] > 0);
}

export function hasActiveLevel(levels: WeightLevels): boolean {
  return BANK_PROFILE_CRITERIA.some((criterion) => {
    const level = levels[criterion];
    return level === "essential" || level === "required" || level > 0;
  });
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

// Stored levels are household data that may predate a criterion added to the
// product later (jointBanking, 2026-10-14): a criterion the household never
// set, or set to something no longer valid, falls back to its product
// default, so the stored set never has to be migrated.
export function resolveCriteriaWeights(
  stored: Partial<Record<BankProfileCriterion, unknown>>,
): WeightLevels {
  const resolved = Object.fromEntries(
    BANK_PROFILE_CRITERIA.map((criterion) => {
      const level = stored[criterion];
      return [criterion, isValidWeightLevel(level) ? level : DEFAULT_WEIGHT_LEVELS[criterion]];
    }),
  ) as Record<BankProfileCriterion, CriterionWeightLevel>;
  return hasActiveLevel(resolved) ? resolved : DEFAULT_WEIGHT_LEVELS;
}

// ADR-0006 amendment 2026-10-14: a criterion marked essential or required
// pulls exactly as much as every numeric criterion combined, so the special
// (essential-or-required) criteria together always account for exactly half
// the note. With E special criteria and N the sum of the numeric levels,
// each numeric weight scales by E and each special criterion's weight
// becomes N; with no numeric weight at all (N = 0), each special criterion
// simply gets weight 1.
export function effectiveWeights(levels: WeightLevels): CriteriaWeights {
  const specialCriteria = BANK_PROFILE_CRITERIA.filter(
    (criterion) => typeof levels[criterion] !== "number",
  );
  const essentialOrRequiredCount = specialCriteria.length;
  const numericSum = BANK_PROFILE_CRITERIA.reduce((sum, criterion) => {
    const level = levels[criterion];
    return typeof level === "number" ? sum + level : sum;
  }, 0);

  if (essentialOrRequiredCount === 0) {
    return Object.fromEntries(
      BANK_PROFILE_CRITERIA.map((criterion) => [criterion, levels[criterion] as number]),
    ) as CriteriaWeights;
  }

  const specialWeight = numericSum > 0 ? numericSum : 1;
  return Object.fromEntries(
    BANK_PROFILE_CRITERIA.map((criterion) => {
      const level = levels[criterion];
      if (typeof level === "number") {
        return [criterion, numericSum > 0 ? level * essentialOrRequiredCount : 0];
      }
      return [criterion, specialWeight];
    }),
  ) as CriteriaWeights;
}

// Which criteria the household gated behind a minimum score (scoring.ts);
// essential criteria pull harder but carry no gate.
export function requiredCriteriaOf(levels: WeightLevels): BankProfileCriterion[] {
  return BANK_PROFILE_CRITERIA.filter((criterion) => levels[criterion] === "required");
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
