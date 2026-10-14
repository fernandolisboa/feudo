import { z } from "zod";
import {
  BANK_PROFILE_CRITERIA,
  CANDIDATE_COUNT_MAX,
  CANDIDATE_COUNT_MIN,
  CRITERION_WEIGHT_MAX,
  CRITERION_WEIGHT_MIN,
  hasActiveLevel,
  MINIMUM_SCORE_MAX,
  MINIMUM_SCORE_MIN,
  MINIMUM_SCORE_STEP,
  PRO_CON_MIN_DIFFERENCE_MAX,
  PRO_CON_MIN_DIFFERENCE_MIN,
  PRO_CON_MIN_DIFFERENCE_STEP,
  type BankProfileCriterion,
  type ComparisonSettings,
  type WeightLevels,
} from "@feudo/core";

const numericLevelSchema = z.int().min(CRITERION_WEIGHT_MIN).max(CRITERION_WEIGHT_MAX);
const weightLevelSchema = z.union([
  numericLevelSchema,
  z.literal("essential"),
  z.literal("required"),
]);

// What the table may hold: a criterion missing from the object is tolerated
// and filled with its product default by resolveCriteriaWeights.
export const storedWeightLevelsSchema = z.partialRecord(
  z.enum(BANK_PROFILE_CRITERIA),
  weightLevelSchema,
);
export type StoredWeightLevels = z.infer<typeof storedWeightLevelsSchema>;

const minimumScoreSchema = z
  .int()
  .min(MINIMUM_SCORE_MIN)
  .max(MINIMUM_SCORE_MAX)
  .multipleOf(MINIMUM_SCORE_STEP);
const candidateCountSchema = z.int().min(CANDIDATE_COUNT_MIN).max(CANDIDATE_COUNT_MAX);
const proConMinDifferenceSchema = z
  .int()
  .min(PRO_CON_MIN_DIFFERENCE_MIN)
  .max(PRO_CON_MIN_DIFFERENCE_MAX)
  .multipleOf(PRO_CON_MIN_DIFFERENCE_STEP);

// What the table may hold for comparison options: every field is optional,
// the same "missing or invalid falls back to the default" policy as weights
// (resolveComparisonSettings, packages/core). Parsed field by field below
// (parseStoredComparisonOptions), not through a single zod object schema, so
// one invalid field never discards the others.
export type StoredComparisonOptions = {
  minimumScores?: Partial<Record<BankProfileCriterion, number>>;
  candidateCount?: number;
  proConMinDifference?: number;
};

function parseStoredMinimumScores(
  value: unknown,
): Partial<Record<BankProfileCriterion, number>> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const minimumScores: Partial<Record<BankProfileCriterion, number>> = {};
  for (const criterion of BANK_PROFILE_CRITERIA) {
    const parsed = minimumScoreSchema.safeParse(record[criterion]);
    if (parsed.success) minimumScores[criterion] = parsed.data;
  }
  return Object.keys(minimumScores).length === 0 ? undefined : minimumScores;
}

// Every field falls back to its own default independently (ADR-0006,
// 2026-10-14): one bad field (an out-of-range candidateCount, say) never
// discards an otherwise valid minimumScores or proConMinDifference next to
// it, so this never fails outright, unlike storedWeightLevelsSchema above.
export function parseStoredComparisonOptions(value: unknown): StoredComparisonOptions {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const minimumScores = parseStoredMinimumScores(record.minimumScores);
  const candidateCount = candidateCountSchema.safeParse(record.candidateCount);
  const proConMinDifference = proConMinDifferenceSchema.safeParse(record.proConMinDifference);
  return {
    ...(minimumScores ? { minimumScores } : {}),
    ...(candidateCount.success ? { candidateCount: candidateCount.data } : {}),
    ...(proConMinDifference.success ? { proConMinDifference: proConMinDifference.data } : {}),
  };
}

// Whether the column held something shaped at all like comparison options,
// as opposed to garbage (repository.ts: a column that is merely absent, the
// common case for a row saved before this setting existed, is not this).
export function isReadableComparisonOptions(value: unknown): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const formNumericLevelSchema = z
  .string()
  .regex(/^[0-9]+$/)
  .transform(Number)
  .pipe(numericLevelSchema);
const formWeightLevelSchema = z.union([
  formNumericLevelSchema,
  z.literal("essential"),
  z.literal("required"),
]);
const formMinimumScoreSchema = z
  .string()
  .regex(/^[0-9]+$/)
  .transform(Number)
  .pipe(minimumScoreSchema);
const formCandidateCountSchema = z
  .string()
  .regex(/^[0-9]+$/)
  .transform(Number)
  .pipe(candidateCountSchema);
const formProConMinDifferenceSchema = z
  .string()
  .regex(/^[0-9]+$/)
  .transform(Number)
  .pipe(proConMinDifferenceSchema);

export const comparisonSettingsFormSchema = z.object({
  levels: z.object(
    Object.fromEntries(
      BANK_PROFILE_CRITERIA.map((criterion) => [criterion, formWeightLevelSchema]),
    ) as Record<BankProfileCriterion, typeof formWeightLevelSchema>,
  ),
  minimumScores: z.object(
    Object.fromEntries(
      BANK_PROFILE_CRITERIA.map((criterion) => [criterion, formMinimumScoreSchema]),
    ) as Record<BankProfileCriterion, typeof formMinimumScoreSchema>,
  ),
  candidateCount: formCandidateCountSchema,
  proConMinDifference: formProConMinDifferenceSchema,
});

export type ComparisonSettingsFormResult =
  | { status: "ok"; levels: WeightLevels; options: ComparisonSettings }
  | { status: "invalid" }
  | { status: "all_zero" };

export function minimumScoreFieldName(criterion: BankProfileCriterion): string {
  return `min_${criterion}`;
}

export function parseComparisonSettingsForm(formData: FormData): ComparisonSettingsFormResult {
  const raw = {
    levels: Object.fromEntries(
      BANK_PROFILE_CRITERIA.map((criterion) => [criterion, formData.get(criterion)]),
    ),
    minimumScores: Object.fromEntries(
      BANK_PROFILE_CRITERIA.map((criterion) => [
        criterion,
        formData.get(minimumScoreFieldName(criterion)),
      ]),
    ),
    candidateCount: formData.get("candidateCount"),
    proConMinDifference: formData.get("proConMinDifference"),
  };
  const parsed = comparisonSettingsFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "invalid" };
  }
  // The schema already restricted every numeric level to 0-5 at runtime;
  // Zod just cannot carry that range as a literal type.
  const levels = parsed.data.levels as unknown as WeightLevels;
  if (!hasActiveLevel(levels)) {
    return { status: "all_zero" };
  }
  return {
    status: "ok",
    levels,
    options: {
      minimumScores: parsed.data.minimumScores,
      candidateCount: parsed.data.candidateCount,
      proConMinDifference: parsed.data.proConMinDifference,
    },
  };
}
