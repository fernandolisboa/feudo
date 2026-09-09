import { headers } from "next/headers";
import { cache } from "react";

import { getAuth } from "./auth";

export type CurrentSession = { userId: string; name: string; email: string; theme: string };

// The theme column's DB default guarantees a value once a user exists;
// deciding which strings are valid theme names is modules/theme's job
// (resolveTheme), not auth's — auth must not import theme at runtime.
const RAW_THEME_FALLBACK = "caderno";

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
    theme: session.user.theme ?? RAW_THEME_FALLBACK,
  };
});
