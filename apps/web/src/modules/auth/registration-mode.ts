import type { RegistrationMode } from "@feudo/core";

import type { RuntimeSettings } from "@/platform/runtime-settings";
import { type AuthEnv, parseRegistrationMode, readRegistrationMode } from "./env";

export const REGISTRATION_MODE_SETTING = "registration_mode";

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
    });
  }
  return readRegistrationMode(env);
}
