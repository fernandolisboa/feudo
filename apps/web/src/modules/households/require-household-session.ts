import { redirect } from "next/navigation";

import { getCurrentSession, type CurrentSession } from "@/modules/auth";

import { resolveAppRoute } from "./routing";

export type HouseholdSession = CurrentSession & { householdId: string };

// The layout's own redirect (resolveAppRoute in the (app) layout) is UX: it
// keeps a signed-out or household-less visitor from ever rendering a page's
// content. This is the security guarantee every (app) page and action must
// call for itself, since nothing stops a page or action from running without
// its layout in tests, or from a future route that has no such layout.
export async function requireHouseholdSession(): Promise<HouseholdSession> {
  const session = await getCurrentSession();
  const redirectTarget = resolveAppRoute(session);
  if (redirectTarget) {
    redirect(redirectTarget);
  }
  // resolveAppRoute returns null only when session is non-null and has an
  // active householdId (see routing.ts) — TypeScript cannot express that
  // invariant across the two functions, so it is asserted here once.
  return session as HouseholdSession;
}
