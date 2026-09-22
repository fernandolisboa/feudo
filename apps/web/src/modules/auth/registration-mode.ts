import type { RegistrationMode } from "@feudo/core";

import type { RuntimeSettings } from "@/platform/runtime-settings";
import { type AuthEnv, parseRegistrationMode, readRegistrationMode } from "./env";

export const REGISTRATION_MODE_SETTING = "registration_mode";

// The store item sits next to secrets in the Vercel dashboard, so a value this
// long is more likely a mis-pasted database URL or API key than a typo'd mode
// ("closed" is six characters); log only its length, never its content.
const MAX_LOGGED_VALUE_LENGTH = 12;

function describeInvalidStoredValue(stored: unknown): {
  type: string;
  value?: string;
  length?: number;
} {
  if (typeof stored !== "string") {
    return { type: typeof stored };
  }
  return stored.length <= MAX_LOGGED_VALUE_LENGTH
    ? { type: "string", value: stored }
    : { type: "string", length: stored.length };
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
    console.error(
      "registration_mode setting ignored: invalid value",
      describeInvalidStoredValue(stored),
    );
  }
  return readRegistrationMode(env);
}
