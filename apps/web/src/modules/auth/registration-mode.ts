import type { RegistrationMode } from "@feudo/core";

import type { RuntimeSettings } from "@/platform/runtime-settings";
import { type AuthEnv, parseRegistrationMode, readRegistrationMode } from "./env";

export const REGISTRATION_MODE_SETTING = "registration_mode";

// A registration mode is at most six characters ("closed"), so 32 shows any
// realistic typo in full while bounding what reaches the logs if someone
// pastes something large into the store item by mistake.
const MAX_LOGGED_VALUE_LENGTH = 32;
const TRUNCATION_MARKER = "…";

function truncateForLog(value: string): string {
  return value.length > MAX_LOGGED_VALUE_LENGTH
    ? `${value.slice(0, MAX_LOGGED_VALUE_LENGTH)}${TRUNCATION_MARKER}`
    : value;
}

export async function resolveRegistrationMode(
  settings: RuntimeSettings,
  env: AuthEnv,
): Promise<RegistrationMode> {
  const stored = await settings.read(REGISTRATION_MODE_SETTING);
  if (stored !== undefined && stored !== null && stored !== "") {
    const parsed = typeof stored === "string" ? parseRegistrationMode(stored) : undefined;
    if (parsed !== undefined) {
      return parsed;
    }
    console.error("registration_mode setting ignored: invalid value", {
      type: typeof stored,
      ...(typeof stored === "string" ? { value: truncateForLog(stored) } : {}),
    });
  }
  return readRegistrationMode(env);
}
