import { DatabaseResetNotAllowedError } from "./errors.ts";
import { checkDatabaseHost, type DatabaseHostEnv } from "./host-policy.ts";

export interface ResetGuardEnv extends DatabaseHostEnv {
  VERCEL_ENV?: string;
}

export function assertDatabaseResetAllowed(env: ResetGuardEnv): void {
  if (env.VERCEL_ENV === "production") {
    throw new DatabaseResetNotAllowedError("VERCEL_ENV is production");
  }

  const check = checkDatabaseHost(env);
  if (!check.ok) {
    throw new DatabaseResetNotAllowedError(check.reason);
  }
}
