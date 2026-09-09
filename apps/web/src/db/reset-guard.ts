import { DatabaseResetNotAllowedError } from "./errors.ts";

export interface ResetGuardEnv {
  DATABASE_RESET_ALLOWED?: string;
  VERCEL_ENV?: string;
  [key: string]: string | undefined;
}

export function assertDatabaseResetAllowed(env: ResetGuardEnv): void {
  if (env.VERCEL_ENV === "production") {
    throw new DatabaseResetNotAllowedError("VERCEL_ENV is production");
  }

  if (env.DATABASE_RESET_ALLOWED !== "preview") {
    throw new DatabaseResetNotAllowedError('DATABASE_RESET_ALLOWED must be set to "preview"');
  }
}
