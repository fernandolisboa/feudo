import { headers } from "next/headers";
import { cache } from "react";

// Imports the theme module's tokens file directly, not its index: see the
// matching note in options.ts for why (avoids an auth <-> theme import cycle).
import { DEFAULT_THEME, isThemeName, type ThemeName } from "@/modules/theme/tokens";

import { getAuth } from "./auth";

export type CurrentSession = { userId: string; name: string; email: string; theme: ThemeName };

function readTheme(user: { theme?: unknown }): ThemeName {
  return typeof user.theme === "string" && isThemeName(user.theme) ? user.theme : DEFAULT_THEME;
}

// Wrapped in React's cache() so the root layout, the signed-in route group's
// layout and a page can each call this once per request without three round
// trips to the session store; outside a React render (e.g. these modules'
// own tests) cache() is a no-op and every call runs fresh.
export const getCurrentSession = cache(async (): Promise<CurrentSession | null> => {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) {
    return null;
  }
  return {
    userId: session.user.id,
    name: session.user.name,
    email: session.user.email,
    theme: readTheme(session.user),
  };
});
