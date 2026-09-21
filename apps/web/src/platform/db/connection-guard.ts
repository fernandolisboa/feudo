import { DatabaseConnectionNotAllowedError } from "./errors.ts";
import { databaseHost } from "./reset-guard.ts";

export interface ConnectionGuardEnv {
  DATABASE_URL?: string;
  DATABASE_RESET_ALLOWED_HOST?: string;
  DATABASE_PRODUCTION_HOST?: string;
  VERCEL?: string;
  [key: string]: string | undefined;
}

export interface ConnectionGuardOptions {
  allowProduction?: boolean;
}

export function assertDatabaseConnectionAllowed(
  env: ConnectionGuardEnv,
  { allowProduction = false }: ConnectionGuardOptions = {},
): void {
  if (env.VERCEL === "1") {
    return;
  }

  let targetHost: string;
  try {
    targetHost = databaseHost(new URL(env.DATABASE_URL ?? "").hostname);
  } catch {
    throw new DatabaseConnectionNotAllowedError("DATABASE_URL is not a valid URL");
  }

  if (env.DATABASE_PRODUCTION_HOST && targetHost === databaseHost(env.DATABASE_PRODUCTION_HOST)) {
    if (allowProduction) {
      return;
    }
    throw new DatabaseConnectionNotAllowedError(
      "DATABASE_URL's host matches DATABASE_PRODUCTION_HOST",
    );
  }

  if (!env.DATABASE_RESET_ALLOWED_HOST) {
    throw new DatabaseConnectionNotAllowedError("DATABASE_RESET_ALLOWED_HOST is not set");
  }

  if (targetHost !== databaseHost(env.DATABASE_RESET_ALLOWED_HOST)) {
    throw new DatabaseConnectionNotAllowedError(
      "DATABASE_RESET_ALLOWED_HOST does not match DATABASE_URL's host",
    );
  }
}
