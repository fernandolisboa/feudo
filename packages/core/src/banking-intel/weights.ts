import { BANK_PROFILE_CRITERIA, type BankProfileCriterion } from "./criteria";

export const CRITERION_WEIGHT_MIN = 0;
export const CRITERION_WEIGHT_MAX = 5;

export type CriteriaWeights = Readonly<Record<BankProfileCriterion, number>>;

export const DEFAULT_CRITERIA_WEIGHTS: CriteriaWeights = {
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

export function isValidCriterionWeight(weight: number): boolean {
  return (
    Number.isInteger(weight) && weight >= CRITERION_WEIGHT_MIN && weight <= CRITERION_WEIGHT_MAX
  );
}

export function hasActiveCriterion(weights: CriteriaWeights): boolean {
  return BANK_PROFILE_CRITERIA.some((criterion) => weights[criterion] > 0);
}

// Scoring normalises weights, so it only needs non-negative integers with at
// least one above zero; the 0 to 5 range is what a household can store.
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

// Stored weights are household data that may predate a criterion added to
// the product later: a criterion the household never set falls back to its
// product default, so the stored set never has to be migrated.
export function resolveCriteriaWeights(
  stored: Partial<Record<BankProfileCriterion, number>>,
): CriteriaWeights {
  const resolved = Object.fromEntries(
    BANK_PROFILE_CRITERIA.map((criterion) => {
      const weight = stored[criterion];
      return [
        criterion,
        weight !== undefined && isValidCriterionWeight(weight)
          ? weight
          : DEFAULT_CRITERIA_WEIGHTS[criterion],
      ];
    }),
  ) as Record<BankProfileCriterion, number>;
  return hasActiveCriterion(resolved) ? resolved : DEFAULT_CRITERIA_WEIGHTS;
}
