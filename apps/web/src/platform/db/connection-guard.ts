import { DatabaseConnectionNotAllowedError } from "./errors.ts";
import {
  checkDatabaseHost,
  type DatabaseHostEnv,
  type DatabaseHostOptions,
} from "./host-policy.ts";

export function assertDatabaseConnectionAllowed(
  env: DatabaseHostEnv,
  options: DatabaseHostOptions = {},
): void {
  const check = checkDatabaseHost(env, options);
  if (!check.ok) {
    throw new DatabaseConnectionNotAllowedError(check.reason);
  }
}
