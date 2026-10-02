import type { AnalysisInput } from "@feudo/core";

// Sonnet by default, Opus only for the monthly deep analysis (CLAUDE.md, AI).
export const AI_MODELS = {
  standard: "claude-sonnet-5-5",
  deep: "claude-opus-5-5",
} as const;

export type AiTier = keyof typeof AI_MODELS;

export type AiUsage = { inputTokens: number; outputTokens: number };

export type AiRequest = {
  tier: AiTier;
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
  complete(request: AiRequest): Promise<AiResult>;
}
