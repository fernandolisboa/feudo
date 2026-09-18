import { and, eq } from "drizzle-orm";

import { session as sessionTable } from "./schema";

import type { Database } from "@/platform/db/client";

// Shared by organizationHooks.afterRemoveMember (options.ts, a removed
// member's stale session) and households.leaveHousehold (a non-owner who
// just left): both need the same user's other sessions to stop resolving to
// a household they no longer belong to, immediately, not just on their next
// getCurrentSession() re-validation.
export async function clearActiveHouseholdOnSessions(
  db: Database,
  userId: string,
  householdId: string,
): Promise<void> {
  await db
    .update(sessionTable)
    .set({ activeOrganizationId: null })
    .where(
      and(eq(sessionTable.userId, userId), eq(sessionTable.activeOrganizationId, householdId)),
    );
}
