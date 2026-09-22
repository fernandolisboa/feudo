import type { RegistrationMode } from "@feudo/core";

import type { RuntimeSettings } from "@/platform/runtime-settings";
import { type AuthEnv, readRegistrationMode, registrationModeSchema } from "./env";

export const REGISTRATION_MODE_SETTING = "registration_mode";

export async function resolveRegistrationMode(
  settings: RuntimeSettings,
  env: AuthEnv,
): Promise<RegistrationMode> {
  const stored = await settings.read(REGISTRATION_MODE_SETTING);
  if (stored !== undefined && stored !== null && stored !== "") {
    const parsed = registrationModeSchema.safeParse(stored);
    if (parsed.success) {
      return parsed.data;
    }
    console.error("registration_mode setting ignored: invalid value", {
      type: typeof stored,
    });
  }
  return readRegistrationMode(env);
}
