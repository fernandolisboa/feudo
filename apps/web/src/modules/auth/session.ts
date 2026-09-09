import { headers } from "next/headers";
import { cache } from "react";
import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { member, session as sessionTable } from "@/db/schema";

import type { Database } from "@/db/client";
import { getAuth } from "./auth";

export type CurrentSession = {
  userId: string;
  name: string;
  email: string;
  householdId: string | null;
  theme: string;
};

// The theme column's DB default guarantees a value once a user exists;
// deciding which strings are valid theme names is modules/theme's job
// (resolveTheme), not auth's — auth must not import theme at runtime.
const RAW_THEME_FALLBACK = "caderno";

// A session's activeOrganizationId is only ever a hint: it can be stale
// (membership revoked or the household deleted since it was set) or absent
// (a fresh sign-in, since Better Auth does not populate it on its own). This
// re-validates it against the member table on every read, and falls back to
// the user's most recently joined household when it is missing or stale —
// this is what makes a second sign-in land back in the same household
// instead of onboarding, and what stops a removed member's still-valid
// session from resolving to a household it no longer belongs to.
async function resolveHouseholdId(
  db: Database,
  userId: string,
  sessionId: string,
  activeOrganizationId: string | null,
): Promise<string | null> {
  const memberships = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId))
    .orderBy(desc(member.createdAt));

  if (
    activeOrganizationId &&
    memberships.some((row) => row.organizationId === activeOrganizationId)
  ) {
    return activeOrganizationId;
  }

  const fallbackHouseholdId = memberships[0]?.organizationId ?? null;
  if (fallbackHouseholdId !== activeOrganizationId) {
    await db
      .update(sessionTable)
      .set({ activeOrganizationId: fallbackHouseholdId })
      .where(eq(sessionTable.id, sessionId));
  }
  return fallbackHouseholdId;
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

  const householdId = await resolveHouseholdId(
    getDb(),
    session.user.id,
    session.session.id,
    session.session.activeOrganizationId ?? null,
  );

  return {
    userId: session.user.id,
    name: session.user.name,
    email: session.user.email,
    householdId,
    theme: session.user.theme ?? RAW_THEME_FALLBACK,
  };
});
