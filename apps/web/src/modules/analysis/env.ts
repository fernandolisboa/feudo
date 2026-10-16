import { z } from "zod";

import {
  hasValidEncryptionKey,
  MissingEncryptionKeyError,
  readEncryptionKey as readSharedEncryptionKey,
} from "@/platform/encryption-key";

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

export { MissingEncryptionKeyError };

const aiProviderSchema = z.enum(["anthropic", "fake", "off"]);

function readOptional(env: AnalysisEnv, key: string): string | undefined {
  const raw = env[key];
  return raw === undefined || raw.trim() === "" ? undefined : raw;
}

// The key now belongs to the household (ADR-0013), not the deploy: this
// only decides whether the household is even allowed to have an analyst,
// never whether one has registered a key. hasValidEncryptionKey (not mere
// presence) is what gates the anthropic branch, so readEncryptionKey below
// is guaranteed to succeed whenever this returns "anthropic".
export function readAiProviderName(env: AnalysisEnv = process.env): AiProviderName {
  const raw = readOptional(env, "AI_PROVIDER");
  const hasEncryptionKey = hasValidEncryptionKey(env);
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
  // Without a usable ENCRYPTION_KEY nothing can decrypt a household's
  // stored key, so Anthropic has no way to run regardless of how it was
  // asked for.
  if (parsed.data === "anthropic" && !hasEncryptionKey) {
    return "off";
  }
  return parsed.data;
}

export function readEncryptionKey(env: AnalysisEnv = process.env): string {
  return readSharedEncryptionKey(env);
}
