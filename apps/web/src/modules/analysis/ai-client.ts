import type { AnalysisInput } from "@feudo/core";

export type AiTier = "standard" | "deep";

// The household picks the family (ADR-0013); the newest qualifying version
// of it is resolved at call time (model-resolution.ts). These three ids are
// the safety net: known-good, used whenever resolution fails or returns
// nothing, and retried once whenever a freshly resolved id is itself
// rejected by the API.
export const PINNED_MODEL_IDS = {
  haiku: "claude-haiku-5-5",
  sonnet: "claude-sonnet-5-5",
  opus: "claude-opus-5-5",
} as const;

export type AiFamily = keyof typeof PINNED_MODEL_IDS;

export const AI_FAMILIES = Object.keys(PINNED_MODEL_IDS) as AiFamily[];

// Effort stays a function of the reading's depth, never of the family: the
// monthly reading is always "deep" (high effort), the on-demand one always
// "standard" (medium effort), whichever family the household picked for it.
export const EFFORT: Record<AiTier, "medium" | "high"> = { standard: "medium", deep: "high" };

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

export interface AiClient {
  // Looks up the newest model id for this family and tier, the household's
  // key in hand; callers store the result as the reading's requested_model
  // before asking the model anything.
  resolveModel(family: AiFamily, tier: AiTier): Promise<string>;
  complete(request: AiRequest): Promise<AiResult>;
}
