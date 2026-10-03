import { and, eq } from "drizzle-orm";

import { member, organization } from "@/modules/auth/schema";

import type { DatabaseOrTransaction } from "@/platform/db/client";
import { householdIsNotPendingDeletion } from "./household-deletion";
import type { HouseholdScope } from "./scope";

type Database = DatabaseOrTransaction;

// The one way to turn a household id that did not come from the session
// (a form field, a connection's default household) into a scope: only when
// the user holds a member row there. The row is key-share-locked, so inside
// the caller's transaction a leave or removal of that membership waits for
// the caller to commit instead of slipping in between check and write (#74),
// while role changes and ownership transfers are not held up. A household
// whose deletion is pending is hidden from its members, so it is never a
// destination either.
export async function lockMembershipScope(
  db: Database,
  userId: string,
  householdId: string,
): Promise<HouseholdScope | null> {
  const [row] = await db
    .select({ householdId: member.organizationId })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(
      and(
        eq(member.userId, userId),
        eq(member.organizationId, householdId),
        householdIsNotPendingDeletion(),
      ),
    )
    .limit(1)
    .for("key share", { of: member });
  return row ? { householdId: row.householdId } : null;
}
