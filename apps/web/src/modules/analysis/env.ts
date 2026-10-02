import { z } from "zod";

export interface AnalysisEnv {
  AI_PROVIDER?: string;
  ANTHROPIC_API_KEY?: string;
  VERCEL_ENV?: string;
  [key: string]: string | undefined;
}

export type AiProviderName = "anthropic" | "fake" | "off";

export class InvalidAiProviderError extends Error {
  constructor(value: string) {
    super(`AI_PROVIDER has an invalid value: ${value}`);
    this.name = "InvalidAiProviderError";
  }
}

export class FakeAiProviderInProductionError extends Error {
  constructor() {
    super("AI_PROVIDER=fake is refused in production.");
    this.name = "FakeAiProviderInProductionError";
  }
}

const aiProviderSchema = z.enum(["anthropic", "fake", "off"]);

function readOptional(env: AnalysisEnv, key: string): string | undefined {
  const raw = env[key];
  return raw === undefined || raw.trim() === "" ? undefined : raw;
}

// The analysis is optional to the product (ADR-0004): without an API key it
// is simply off and every screen works without it, rather than failing.
export function readAiProviderName(env: AnalysisEnv = process.env): AiProviderName {
  const raw = readOptional(env, "AI_PROVIDER");
  const hasKey = readOptional(env, "ANTHROPIC_API_KEY") !== undefined;
  if (raw === undefined) {
    return hasKey ? "anthropic" : "off";
  }
  const parsed = aiProviderSchema.safeParse(raw);
  if (!parsed.success) {
    throw new InvalidAiProviderError(raw);
  }
  // The fake writes canned readings; in production a household would take
  // them for a real analysis of its money.
  if (parsed.data === "fake" && env.VERCEL_ENV === "production") {
    throw new FakeAiProviderInProductionError();
  }
  if (parsed.data === "anthropic" && !hasKey) {
    return "off";
  }
  return parsed.data;
}
