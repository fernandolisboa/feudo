import { z } from "zod";

export interface SyncEnv {
  DATA_PROVIDER?: string;
  ENCRYPTION_KEY?: string;
  DOCUMENT_HASH_KEY?: string;
  VERCEL_ENV?: string;
  [key: string]: string | undefined;
}

export type DataProviderName = "pluggy" | "fake";

export class InvalidDataProviderError extends Error {
  constructor(value: string) {
    super(`DATA_PROVIDER has an invalid value: ${value}`);
    this.name = "InvalidDataProviderError";
  }
}

export class FakeDataProviderInProductionError extends Error {
  constructor() {
    super("DATA_PROVIDER=fake is refused in production.");
    this.name = "FakeDataProviderInProductionError";
  }
}

export class MissingSecretError extends Error {
  readonly variable: string;

  constructor(variable: string) {
    super(`${variable} is not set or is shorter than ${String(MIN_SECRET_LENGTH)} characters.`);
    this.name = "MissingSecretError";
    this.variable = variable;
  }
}

function readOptionalEnvValue(env: SyncEnv, key: string): string | undefined {
  const raw = env[key];
  return raw === undefined || raw === "" ? undefined : raw;
}

const dataProviderSchema = z.enum(["pluggy", "fake"]);
const DEFAULT_DATA_PROVIDER: DataProviderName = "pluggy";

export function readDataProviderName(env: SyncEnv = process.env): DataProviderName {
  const raw = readOptionalEnvValue(env, "DATA_PROVIDER");
  if (raw === undefined) {
    return DEFAULT_DATA_PROVIDER;
  }
  const parsed = dataProviderSchema.safeParse(raw);
  if (!parsed.success) {
    throw new InvalidDataProviderError(raw);
  }
  // The fake provider accepts any credentials and returns fixture accounts;
  // in production that would let a household see invented numbers.
  if (parsed.data === "fake" && env.VERCEL_ENV === "production") {
    throw new FakeDataProviderInProductionError();
  }
  return parsed.data;
}

// 32 characters is the floor for a key pasted from a password manager's
// generator; the actual AES key is derived from it (sync/crypto.ts).
const MIN_SECRET_LENGTH = 32;

function readSecret(env: SyncEnv, variable: string): string {
  const raw = readOptionalEnvValue(env, variable);
  if (raw === undefined || raw.length < MIN_SECRET_LENGTH) {
    throw new MissingSecretError(variable);
  }
  return raw;
}

export function readEncryptionKey(env: SyncEnv = process.env): string {
  return readSecret(env, "ENCRYPTION_KEY");
}

export function readDocumentHashKey(env: SyncEnv = process.env): string {
  return readSecret(env, "DOCUMENT_HASH_KEY");
}
