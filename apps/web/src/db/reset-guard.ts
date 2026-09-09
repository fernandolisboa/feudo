import { DatabaseResetNotAllowedError } from "./errors.ts";

export interface ResetGuardEnv {
  DATABASE_URL?: string;
  DATABASE_RESET_ALLOWED_HOST?: string;
  VERCEL_ENV?: string;
  [key: string]: string | undefined;
}

export function assertDatabaseResetAllowed(env: ResetGuardEnv): void {
  if (env.VERCEL_ENV === "production") {
    throw new DatabaseResetNotAllowedError("VERCEL_ENV is production");
  }

  if (!env.DATABASE_RESET_ALLOWED_HOST) {
    throw new DatabaseResetNotAllowedError("DATABASE_RESET_ALLOWED_HOST is not set");
  }

  let targetHost: string;
  try {
    targetHost = new URL(env.DATABASE_URL ?? "").hostname;
  } catch {
    throw new DatabaseResetNotAllowedError("DATABASE_URL is not a valid URL");
  }

  if (targetHost !== env.DATABASE_RESET_ALLOWED_HOST) {
    throw new DatabaseResetNotAllowedError(
      "DATABASE_RESET_ALLOWED_HOST does not match DATABASE_URL's host",
    );
  }
}
