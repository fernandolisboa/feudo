import { z } from "zod";

export interface AnalysisEnv {
  AI_PROVIDER?: string;
  ENCRYPTION_KEY?: string;
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

export class MissingEncryptionKeyError extends Error {
  constructor() {
    super(
      `ENCRYPTION_KEY is not set or is shorter than ${String(MIN_ENCRYPTION_KEY_LENGTH)} characters.`,
    );
    this.name = "MissingEncryptionKeyError";
  }
}

const aiProviderSchema = z.enum(["anthropic", "fake", "off"]);

function readOptional(env: AnalysisEnv, key: string): string | undefined {
  const raw = env[key];
  return raw === undefined || raw.trim() === "" ? undefined : raw;
}

// The key now belongs to the household (ADR-0013), not the deploy: this
// only decides whether the household is even allowed to have an analyst,
// never whether one has registered a key.
export function readAiProviderName(env: AnalysisEnv = process.env): AiProviderName {
  const raw = readOptional(env, "AI_PROVIDER");
  const hasEncryptionKey = readOptional(env, "ENCRYPTION_KEY") !== undefined;
  if (raw === undefined) {
    return hasEncryptionKey ? "anthropic" : "off";
  }
  const parsed = aiProviderSchema.safeParse(raw);
  if (!parsed.success) {
    throw new InvalidAiProviderError(raw);
  }
  // The fake writes canned readings and ignores every key; in production a
  // household would take them for a real analysis of its money.
  if (parsed.data === "fake" && env.VERCEL_ENV === "production") {
    throw new FakeAiProviderInProductionError();
  }
  // Without ENCRYPTION_KEY nothing can decrypt a household's stored key, so
  // Anthropic has no way to run regardless of how it was asked for.
  if (parsed.data === "anthropic" && !hasEncryptionKey) {
    return "off";
  }
  return parsed.data;
}

const MIN_ENCRYPTION_KEY_LENGTH = 32;

// Mirrors sync/env.ts's own readEncryptionKey: each slice that decrypts a
// secret with ENCRYPTION_KEY reads and validates it itself, rather than
// reaching into another slice for an env helper that holds no domain logic.
export function readEncryptionKey(env: AnalysisEnv = process.env): string {
  const raw = readOptional(env, "ENCRYPTION_KEY");
  if (raw === undefined || raw.length < MIN_ENCRYPTION_KEY_LENGTH) {
    throw new MissingEncryptionKeyError();
  }
  return raw;
}
