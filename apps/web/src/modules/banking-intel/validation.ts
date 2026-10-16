import { z } from "zod";
import {
  ACCOUNT_TYPES,
  BANK_PROFILE_CRITERIA,
  BANK_PROFILE_SCORE_MAX,
  BANK_PROFILE_SCORE_MIN,
  CANDIDATE_COUNT_MAX,
  CANDIDATE_COUNT_MIN,
  CRITERION_WEIGHT_MAX,
  CRITERION_WEIGHT_MIN,
  hasActiveLevel,
  PRO_CON_MIN_DIFFERENCE_MAX,
  PRO_CON_MIN_DIFFERENCE_MIN,
  PRO_CON_MIN_DIFFERENCE_STEP,
  type AccountTypeFilter,
  type BankProfileCriterion,
  type ComparisonSettings,
  type WeightLevels,
} from "@feudo/core";
import { institutionById, isoDateSchema } from "@feudo/core/reference-data";

// The stored weights column is household data that may predate a criterion
// dropped from the product (jointBanking) or hold its retired "essential"/
// "required" special levels (ADR-0006 amendment 2026-10-16): resolveCriteriaWeights
// (packages/core) reads only the current criteria and maps a legacy level to
// its numeric equivalent on its own, so neither ever fails the row. Only a
// column that is not even object-shaped is unreadable.
export type StoredWeightLevels = Partial<Record<BankProfileCriterion, unknown>>;

export function isReadableWeightLevels(value: unknown): value is StoredWeightLevels {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const numericLevelSchema = z.int().min(CRITERION_WEIGHT_MIN).max(CRITERION_WEIGHT_MAX);
const candidateCountSchema = z.int().min(CANDIDATE_COUNT_MIN).max(CANDIDATE_COUNT_MAX);
const proConMinDifferenceSchema = z
  .int()
  .min(PRO_CON_MIN_DIFFERENCE_MIN)
  .max(PRO_CON_MIN_DIFFERENCE_MAX)
  .multipleOf(PRO_CON_MIN_DIFFERENCE_STEP);
const requirementLevelSchema = z.enum(["optional", "required"]);

// What the table may hold for comparison options: every field is optional,
// the same "missing or invalid falls back to the default" policy as weights
// (resolveComparisonSettings, packages/core). Parsed field by field below
// (parseStoredComparisonOptions), not through a single zod object schema, so
// one invalid field never discards the others. `minimumScores` is retired
// (ADR-0006 amendment 2026-10-16) and dropped on read without comment: it is
// legacy data, not a mistake worth a warning.
export type StoredComparisonOptions = {
  candidateCount?: number;
  proConMinDifference?: number;
  accountTypeFilter?: Partial<AccountTypeFilter>;
};

type ParsedAccountTypeFilter = {
  accountTypeFilter: Partial<AccountTypeFilter> | undefined;
  droppedFields: string[];
};

// Each field falls back to its own default independently, same as the rest
// of the stored options; only a field that is present and fails validation
// is named, never one the household simply never set.
function parseStoredAccountTypeFilter(value: unknown): ParsedAccountTypeFilter {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { accountTypeFilter: undefined, droppedFields: [] };
  }
  const record = value as Record<string, unknown>;
  const accountTypeFilter: Partial<AccountTypeFilter> = {};
  const droppedFields: string[] = [];

  if ("jointBanking" in record) {
    const parsed = requirementLevelSchema.safeParse(record.jointBanking);
    if (parsed.success) accountTypeFilter.jointBanking = parsed.data;
    else droppedFields.push("accountTypeFilter.jointBanking");
  }
  if ("jointOnly" in record) {
    if (typeof record.jointOnly === "boolean") accountTypeFilter.jointOnly = record.jointOnly;
    else droppedFields.push("accountTypeFilter.jointOnly");
  }
  if ("jointInvestment" in record) {
    const parsed = requirementLevelSchema.safeParse(record.jointInvestment);
    if (parsed.success) accountTypeFilter.jointInvestment = parsed.data;
    else droppedFields.push("accountTypeFilter.jointInvestment");
  }
  if ("mei" in record) {
    const parsed = requirementLevelSchema.safeParse(record.mei);
    if (parsed.success) accountTypeFilter.mei = parsed.data;
    else droppedFields.push("accountTypeFilter.mei");
  }

  return {
    accountTypeFilter: Object.keys(accountTypeFilter).length === 0 ? undefined : accountTypeFilter,
    droppedFields,
  };
}

export type ParsedComparisonOptions = {
  value: StoredComparisonOptions;
  droppedFields: string[];
};

// Every field falls back to its own default independently (ADR-0006,
// 2026-10-14): one bad field (an out-of-range candidateCount, say) never
// discards an otherwise valid accountTypeFilter or proConMinDifference next
// to it, so this never fails outright, unlike a strict object schema would.
// droppedFields names only the fields that were present and invalid, for the
// service to warn about (repository.ts); a field the household never set is
// not a drop, and `minimumScores` (retired) is never reported either way.
export function parseStoredComparisonOptions(value: unknown): ParsedComparisonOptions {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { value: {}, droppedFields: [] };
  }
  const record = value as Record<string, unknown>;
  const { accountTypeFilter, droppedFields: filterDrops } = parseStoredAccountTypeFilter(
    record.accountTypeFilter,
  );
  const droppedFields = [...filterDrops];

  let candidateCount: number | undefined;
  if ("candidateCount" in record) {
    const parsed = candidateCountSchema.safeParse(record.candidateCount);
    if (parsed.success) candidateCount = parsed.data;
    else droppedFields.push("candidateCount");
  }

  let proConMinDifference: number | undefined;
  if ("proConMinDifference" in record) {
    const parsed = proConMinDifferenceSchema.safeParse(record.proConMinDifference);
    if (parsed.success) proConMinDifference = parsed.data;
    else droppedFields.push("proConMinDifference");
  }

  return {
    value: {
      ...(accountTypeFilter ? { accountTypeFilter } : {}),
      ...(candidateCount !== undefined ? { candidateCount } : {}),
      ...(proConMinDifference !== undefined ? { proConMinDifference } : {}),
    },
    droppedFields,
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
const formBooleanSchema = z.enum(["true", "false"]).transform((value) => value === "true");

export const comparisonSettingsFormSchema = z.object({
  levels: z.object(
    Object.fromEntries(
      BANK_PROFILE_CRITERIA.map((criterion) => [criterion, formNumericLevelSchema]),
    ) as Record<BankProfileCriterion, typeof formNumericLevelSchema>,
  ),
  accountTypeFilter: z.object({
    jointBanking: requirementLevelSchema,
    jointOnly: formBooleanSchema,
    jointInvestment: requirementLevelSchema,
    mei: requirementLevelSchema,
  }),
  candidateCount: formCandidateCountSchema,
  proConMinDifference: formProConMinDifferenceSchema,
});

// The account-type filter panel saves on its own, separate from the weights
// form below: it only ever changes accountTypeFilter, merged server-side
// with whatever levels and other options the household already has
// (service.ts, setHouseholdAccountTypeFilter), so this schema only ever
// needs the filter's own four fields.
export const accountTypeFilterFormSchema = z.object({
  jointBanking: requirementLevelSchema,
  jointOnly: formBooleanSchema,
  jointInvestment: requirementLevelSchema,
  mei: requirementLevelSchema,
});

// The inverse of the schema above: turns a filter back into the form
// fields the weights editor also needs to post, since updateComparisonSettingsAction
// takes the whole comparison settings in one request (CriteriaWeightsEditor).
export function accountTypeFilterFormEntries(filter: AccountTypeFilter): Record<string, string> {
  return {
    jointBanking: filter.jointBanking,
    jointOnly: filter.jointOnly ? "true" : "false",
    jointInvestment: filter.jointInvestment,
    mei: filter.mei,
  };
}

export type AccountTypeFilterFormResult =
  { status: "ok"; value: AccountTypeFilter } | { status: "invalid" };

export function parseAccountTypeFilterForm(formData: FormData): AccountTypeFilterFormResult {
  const parsed = accountTypeFilterFormSchema.safeParse({
    jointBanking: formData.get("jointBanking"),
    jointOnly: formData.get("jointOnly"),
    jointInvestment: formData.get("jointInvestment"),
    mei: formData.get("mei"),
  });
  return parsed.success ? { status: "ok", value: parsed.data } : { status: "invalid" };
}

export type ComparisonSettingsFormResult =
  | { status: "ok"; levels: WeightLevels; options: ComparisonSettings }
  | { status: "invalid" }
  | { status: "all_zero" };

export function parseComparisonSettingsForm(formData: FormData): ComparisonSettingsFormResult {
  const raw = {
    levels: Object.fromEntries(
      BANK_PROFILE_CRITERIA.map((criterion) => [criterion, formData.get(criterion)]),
    ),
    accountTypeFilter: {
      jointBanking: formData.get("jointBanking"),
      jointOnly: formData.get("jointOnly"),
      jointInvestment: formData.get("jointInvestment"),
      mei: formData.get("mei"),
    },
    candidateCount: formData.get("candidateCount"),
    proConMinDifference: formData.get("proConMinDifference"),
  };
  const parsed = comparisonSettingsFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "invalid" };
  }
  const levels = parsed.data.levels;
  if (!hasActiveLevel(levels)) {
    return { status: "all_zero" };
  }
  return {
    status: "ok",
    levels,
    options: {
      candidateCount: parsed.data.candidateCount,
      proConMinDifference: parsed.data.proConMinDifference,
      accountTypeFilter: parsed.data.accountTypeFilter,
    },
  };
}

export const OVERRIDE_NOTE_MAX_LENGTH = 500;
export const OVERRIDE_SOURCE_URL_MAX_LENGTH = 500;

const institutionIdSchema = z.string().refine((id) => institutionById(id) !== undefined);
const overrideScoreSchema = z.int().min(BANK_PROFILE_SCORE_MIN).max(BANK_PROFILE_SCORE_MAX);
const overrideNoteSchema = z.string().trim().min(1).max(OVERRIDE_NOTE_MAX_LENGTH);
const overrideSourceUrlSchema = z.url({ protocol: /^https$/ }).max(OVERRIDE_SOURCE_URL_MAX_LENGTH);

export const overrideTargetSchema = z.object({
  institutionId: institutionIdSchema,
  criterion: z.enum(BANK_PROFILE_CRITERIA),
});
export type OverrideTarget = z.infer<typeof overrideTargetSchema>;

export const overrideDecisionSchema = z.enum(["useReference", "keepOwn"]);
export type OverrideDecision = z.infer<typeof overrideDecisionSchema>;

// What the table may hold: an institution dropped from the reference data,
// or a criterion renamed, leaves a row that no longer names anything; the
// repository skips it rather than failing the household's whole comparison.
export const storedOverrideSchema = overrideTargetSchema.extend({
  score: overrideScoreSchema,
  note: overrideNoteSchema,
  sourceUrl: overrideSourceUrlSchema.nullable(),
  baseReviewedAt: isoDateSchema,
  updatedAt: z.date(),
});
export type StoredOverride = z.infer<typeof storedOverrideSchema>;

const overrideFormSchema = overrideTargetSchema.extend({
  seenReviewedAt: isoDateSchema,
  score: z
    .string()
    .regex(/^[0-9]+$/)
    .transform(Number)
    .pipe(overrideScoreSchema),
  note: overrideNoteSchema,
  sourceUrl: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(overrideSourceUrlSchema.nullable()),
});
export type OverrideForm = z.infer<typeof overrideFormSchema>;

export type OverrideFormResult =
  { status: "ok"; value: OverrideForm } | { status: "invalid_source" } | { status: "invalid" };

export function parseOverrideForm(formData: FormData): OverrideFormResult {
  const parsed = overrideFormSchema.safeParse({
    institutionId: formData.get("institutionId"),
    criterion: formData.get("criterion"),
    seenReviewedAt: formData.get("seenReviewedAt"),
    score: formData.get("score"),
    note: formData.get("note"),
    sourceUrl: formData.get("sourceUrl") ?? "",
  });
  if (parsed.success) return { status: "ok", value: parsed.data };
  return parsed.error.issues.some((issue) => issue.path[0] === "sourceUrl")
    ? { status: "invalid_source" }
    : { status: "invalid" };
}

export const accountTypeOverrideTargetSchema = z.object({
  institutionId: institutionIdSchema,
  accountType: z.enum(ACCOUNT_TYPES),
});
export type AccountTypeOverrideTarget = z.infer<typeof accountTypeOverrideTargetSchema>;

// What the table may hold: an institution or an account type Feudo no
// longer profiles leaves a row that no longer names anything; the
// repository skips it rather than failing the household's whole comparison,
// mirroring storedOverrideSchema above.
export const storedAccountTypeOverrideSchema = accountTypeOverrideTargetSchema.extend({
  offered: z.boolean(),
  note: overrideNoteSchema,
  sourceUrl: overrideSourceUrlSchema.nullable(),
  baseReviewedAt: isoDateSchema,
  updatedAt: z.date(),
});
export type StoredAccountTypeOverride = z.infer<typeof storedAccountTypeOverrideSchema>;

const accountTypeOverrideFormSchema = accountTypeOverrideTargetSchema.extend({
  seenReviewedAt: isoDateSchema,
  offered: formBooleanSchema,
  note: overrideNoteSchema,
  sourceUrl: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(overrideSourceUrlSchema.nullable()),
});
export type AccountTypeOverrideForm = z.infer<typeof accountTypeOverrideFormSchema>;

export type AccountTypeOverrideFormResult =
  | { status: "ok"; value: AccountTypeOverrideForm }
  | { status: "invalid_source" }
  | { status: "invalid" };

export function parseAccountTypeOverrideForm(formData: FormData): AccountTypeOverrideFormResult {
  const parsed = accountTypeOverrideFormSchema.safeParse({
    institutionId: formData.get("institutionId"),
    accountType: formData.get("accountType"),
    seenReviewedAt: formData.get("seenReviewedAt"),
    offered: formData.get("offered"),
    note: formData.get("note"),
    sourceUrl: formData.get("sourceUrl") ?? "",
  });
  if (parsed.success) return { status: "ok", value: parsed.data };
  return parsed.error.issues.some((issue) => issue.path[0] === "sourceUrl")
    ? { status: "invalid_source" }
    : { status: "invalid" };
}
