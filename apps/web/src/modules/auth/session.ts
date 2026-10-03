import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { and, desc, eq, isNull } from "drizzle-orm";

import { getDb } from "@/platform/db/client";
import { member, organization, session as sessionTable } from "./schema";

import type { Database } from "@/platform/db/client";
import { getAuth } from "./auth";
import { hasAcceptedCurrentTerms, TERMS_ACCEPTANCE_ROUTE } from "./terms";

export type CurrentSession = {
  userId: string;
  name: string;
  email: string;
  householdId: string | null;
  theme: string;
  termsVersion: string;
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
// session from resolving to a household it no longer belongs to. A household
// whose deletion is pending counts as gone for every member (ADR-0008).
async function resolveHouseholdId(
  db: Database,
  userId: string,
  sessionId: string,
  activeOrganizationId: string | null,
): Promise<string | null> {
  const memberships = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(and(eq(member.userId, userId), isNull(organization.deletionRequestedAt)))
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
  // A user whose account deletion is pending is signed in only to cancel it
  // (getPendingAccountDeletion below); everywhere else they are signed out.
  if (!session || session.user.deletionRequestedAt) {
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
    termsVersion: session.user.termsVersion,
  };
});

export const ACCOUNT_DELETION_PENDING_ROUTE = "/exclusao-agendada";

export type PendingAccountDeletion = {
  userId: string;
  name: string;
  email: string;
  deletionRequestedAt: Date;
};

// The one session read that sees a user whose account deletion is pending:
// only the cancel page and its action use it.
export const getPendingAccountDeletion = cache(async (): Promise<PendingAccountDeletion | null> => {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  const deletionRequestedAt = session?.user.deletionRequestedAt;
  if (!session || !deletionRequestedAt) {
    return null;
  }
  return {
    userId: session.user.id,
    name: session.user.name,
    email: session.user.email,
    deletionRequestedAt: new Date(deletionRequestedAt),
  };
});

// Every page that reads the session passes it here: a user whose account
// deletion is pending has no session anywhere else, and the cancel page is
// the one place they may go (ADR-0001, 2026-10-03).
export async function redirectIfAccountDeletionPending(
  session: CurrentSession | null,
): Promise<void> {
  if (!session && (await getPendingAccountDeletion())) {
    redirect(ACCOUNT_DELETION_PENDING_ROUTE);
  }
}

// Every signed-in page passes here after the pending-deletion check: a user
// who accepted an older version of the terms and privacy policy accepts the
// current one before using Feudo again (ADR-0008, #25). Deleting the account
// and exporting data stay reachable from the acceptance page itself.
export function redirectIfTermsOutdated(session: CurrentSession): void {
  if (!hasAcceptedCurrentTerms(session)) {
    redirect(TERMS_ACCEPTANCE_ROUTE);
  }
}
