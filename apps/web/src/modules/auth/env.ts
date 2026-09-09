import { z } from "zod";
import type { RegistrationMode } from "@feudo/core";

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

const registrationModeSchema = z.enum(["open", "invite", "closed"]);
const DEFAULT_REGISTRATION_MODE: RegistrationMode = "invite";

export function readRegistrationMode(env: NodeJS.ProcessEnv = process.env): RegistrationMode {
  const raw = env.REGISTRATION_MODE;
  if (raw === undefined) {
    return DEFAULT_REGISTRATION_MODE;
  }
  const parsed = registrationModeSchema.safeParse(raw);
  if (!parsed.success) {
    throw new InvalidRegistrationModeError(raw);
  }
  return parsed.data;
}

export type EmailProvider = "resend" | "fake";

const emailProviderSchema = z.enum(["resend", "fake"]);
const DEFAULT_EMAIL_PROVIDER: EmailProvider = "resend";

export function readEmailProvider(env: NodeJS.ProcessEnv = process.env): EmailProvider {
  const raw = env.EMAIL_PROVIDER;
  if (raw === undefined) {
    return DEFAULT_EMAIL_PROVIDER;
  }
  const parsed = emailProviderSchema.safeParse(raw);
  if (!parsed.success) {
    throw new InvalidEmailProviderError(raw);
  }
  return parsed.data;
}
