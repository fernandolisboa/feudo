import type { AnalysisInput, Kind, TransactionDirection } from "@feudo/core";

export type AiTier = "light" | "standard" | "deep";

// The household picks one of these per reading kind (ADR-0013); the
// validation schema's z.enum reads this tuple directly.
export const AI_FAMILIES = ["haiku", "sonnet", "opus"] as const;

export type AiFamily = (typeof AI_FAMILIES)[number];

// The one default per reading kind (ADR-0013): the column defaults in
// schema.ts and the no-row fallback in ai-settings-repository.ts both read
// these, so the two can never drift apart.
export const DEFAULT_MONTHLY_FAMILY: AiFamily = "opus";
export const DEFAULT_ON_DEMAND_FAMILY: AiFamily = "sonnet";
// Category suggestions (ADR-0014): a classification call, cheap enough to
// default to the smallest family.
export const DEFAULT_CATEGORY_SUGGESTION_FAMILY: AiFamily = "haiku";

// The newest qualifying version of the household's family is resolved at
// call time (model-resolution.ts). These three ids are the safety net:
// known-good, used whenever resolution fails or returns nothing, and
// retried once whenever a freshly resolved id is itself rejected by the API.
export const PINNED_MODEL_IDS: Record<AiFamily, string> = {
  haiku: "claude-haiku-5-5",
  sonnet: "claude-sonnet-5-5",
  opus: "claude-opus-5-5",
};

// Effort stays a function of the call's depth, never of the family: the
// monthly reading is always "deep" (high effort), the on-demand one always
// "standard" (medium effort), category suggestions always "light" (low
// effort), whichever family the household picked for it.
export const EFFORT: Record<AiTier, "low" | "medium" | "high"> = {
  light: "low",
  standard: "medium",
  deep: "high",
};

// Below this a call is unlikely to finish; it is better skipped than cut off.
// Shared by service.ts (whether to even start an attempt) and
// anthropic-client.ts (whether the pinned-id retry still has a fair shot).
export const MIN_ATTEMPT_MS: Record<AiTier, number> = {
  light: 5_000,
  standard: 15_000,
  deep: 45_000,
};

export type AiUsage = { inputTokens: number; outputTokens: number };

export type AiRequest = {
  tier: AiTier;
  family: AiFamily;
  // Resolved once per reading attempt (model-resolution.ts); the client
  // tries this id first and falls back to the family's pinned id on a 400
  // or 404 from the API, never on any other failure.
  model: string;
  system: string;
  user: string;
  input: AnalysisInput;
  timeoutMs: number;
};

export type AiFailure = "refused" | "truncated" | "timed_out" | "unavailable" | "malformed";

export type AiResult =
  | { status: "ok"; output: unknown; model: string; usage: AiUsage }
  | { status: AiFailure; model: string | null; usage: AiUsage | null };

// Exactly what the ADR approved, nothing else: one group's index, direction,
// absolute amount and sanitized description, plus the taxonomy it may answer
// from (prompts/category-suggester-v1.ts renders both into the prompt; the
// fake client reads this same object instead of parsing its own output).
export type CategorySuggestionPromptItem = {
  index: number;
  type: TransactionDirection;
  absoluteAmountCentavos: number;
  currency: string;
  description: string;
};

export type CategorySuggestionPromptInput = {
  subcategories: { id: string; label: string; kind: Kind }[];
  items: CategorySuggestionPromptItem[];
};

// Carries only what the real client sends to Anthropic: family, model,
// system, user and the output schema. The fake client answers from `user`
// (the rendered prompt) instead of a parallel, unsanitized copy of the
// input, so this type can never grow a field nothing sends.
export type CategorySuggestionAiRequest = {
  family: AiFamily;
  model: string;
  system: string;
  user: string;
  outputSchema: Record<string, unknown>;
  timeoutMs: number;
};

export interface AiClient {
  // Callers store the result as the reading's requested_model before asking
  // the model anything.
  resolveModel(family: AiFamily, tier: AiTier): Promise<string>;
  complete(request: AiRequest): Promise<AiResult>;
  suggestCategories(request: CategorySuggestionAiRequest): Promise<AiResult>;
}
