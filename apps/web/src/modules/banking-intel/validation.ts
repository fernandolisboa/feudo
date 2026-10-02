import { z } from "zod";
import {
  BANK_PROFILE_CRITERIA,
  CRITERION_WEIGHT_MAX,
  CRITERION_WEIGHT_MIN,
  type BankProfileCriterion,
  type CriteriaWeights,
} from "@feudo/core";

const weightSchema = z.int().min(CRITERION_WEIGHT_MIN).max(CRITERION_WEIGHT_MAX);

// What the table may hold: a criterion missing from the object is tolerated
// and filled with its product default by resolveCriteriaWeights.
export const storedCriteriaWeightsSchema = z.partialRecord(
  z.enum(BANK_PROFILE_CRITERIA),
  weightSchema,
);
export type StoredCriteriaWeights = z.infer<typeof storedCriteriaWeightsSchema>;

const formWeightSchema = z
  .string()
  .regex(/^[0-9]+$/)
  .transform(Number)
  .pipe(weightSchema);

export const criteriaWeightsFormSchema = z.object(
  Object.fromEntries(
    BANK_PROFILE_CRITERIA.map((criterion) => [criterion, formWeightSchema]),
  ) as Record<BankProfileCriterion, typeof formWeightSchema>,
);

export type CriteriaWeightsFormResult =
  { status: "ok"; weights: CriteriaWeights } | { status: "invalid" } | { status: "all_zero" };

export function parseCriteriaWeightsForm(formData: FormData): CriteriaWeightsFormResult {
  const parsed = criteriaWeightsFormSchema.safeParse(
    Object.fromEntries(
      BANK_PROFILE_CRITERIA.map((criterion) => [criterion, formData.get(criterion)]),
    ),
  );
  if (!parsed.success) {
    return { status: "invalid" };
  }
  return BANK_PROFILE_CRITERIA.some((criterion) => parsed.data[criterion] > 0)
    ? { status: "ok", weights: parsed.data }
    : { status: "all_zero" };
}
