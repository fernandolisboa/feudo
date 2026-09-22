import { z } from "zod";
import type { RegistrationMode } from "@feudo/core";

export interface AuthEnv {
  REGISTRATION_MODE?: string;
  EMAIL_PROVIDER?: string;
  BETTER_AUTH_URL?: string;
  VERCEL_URL?: string;
  VERCEL_ENV?: string;
  [key: string]: string | undefined;
}

export class InvalidRegistrationModeError extends Error {
  constructor(value: string) {
    super(`REGISTRATION_MODE has an invalid value: ${value}`);
    this.name = "InvalidRegistrationModeError";
  }
}

export class InvalidEmailProviderError extends Error {
  constructor(value: string) {
    super(`EMAIL_PROVIDER has an invalid value: ${value}`);
    this.name = "InvalidEmailProviderError";
  }
}

export class FakeEmailProviderInProductionError extends Error {
  constructor() {
    super("EMAIL_PROVIDER=fake is refused in production.");
    this.name = "FakeEmailProviderInProductionError";
  }
}

function readOptionalEnvValue(env: AuthEnv, key: string): string | undefined {
  const raw = env[key];
  return raw === undefined || raw === "" ? undefined : raw;
}

export const registrationModeSchema = z.enum(["open", "invite", "closed"]);
const DEFAULT_REGISTRATION_MODE: RegistrationMode = "invite";

export function readRegistrationMode(env: AuthEnv = process.env): RegistrationMode {
  const raw = readOptionalEnvValue(env, "REGISTRATION_MODE");
  if (raw === undefined) {
    return DEFAULT_REGISTRATION_MODE;
  }
  const parsed = registrationModeSchema.safeParse(raw);
  if (!parsed.success) {
    throw new InvalidRegistrationModeError(raw);
  }
  return parsed.data;
}

export type EmailProvider = "resend" | "smtp" | "fake";

const emailProviderSchema = z.enum(["resend", "smtp", "fake"]);
const DEFAULT_EMAIL_PROVIDER: EmailProvider = "resend";

export function readEmailProvider(env: AuthEnv = process.env): EmailProvider {
  const raw = readOptionalEnvValue(env, "EMAIL_PROVIDER");
  if (raw === undefined) {
    return DEFAULT_EMAIL_PROVIDER;
  }
  const parsed = emailProviderSchema.safeParse(raw);
  if (!parsed.success) {
    throw new InvalidEmailProviderError(raw);
  }
  // The fake sender stores every message in fake_sent_emails instead of
  // delivering it (docs/adr/0008): in production that strands every sign-up
  // behind a verification link nobody receives, while reporting the request ok.
  if (parsed.data === "fake" && env.VERCEL_ENV === "production") {
    throw new FakeEmailProviderInProductionError();
  }
  return parsed.data;
}

export function isFakeEmailProvider(env: AuthEnv = process.env): boolean {
  return readEmailProvider(env) === "fake";
}

const DEFAULT_LOCAL_BASE_URL = "http://localhost:3000";

// Preview deployments never set BETTER_AUTH_URL (it would have to be pinned per
// deployment); Vercel sets VERCEL_URL to that deployment's own hostname instead.
export function readAuthBaseUrl(env: AuthEnv = process.env): string {
  const explicit = readOptionalEnvValue(env, "BETTER_AUTH_URL");
  if (explicit) {
    return explicit;
  }
  const vercelUrl = readOptionalEnvValue(env, "VERCEL_URL");
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }
  return DEFAULT_LOCAL_BASE_URL;
}
