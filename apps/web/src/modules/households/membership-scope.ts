import { and, eq } from "drizzle-orm";

import { member } from "@/modules/auth/schema";

import type { DatabaseOrTransaction } from "@/platform/db/client";
import type { HouseholdScope } from "./scope";

type Database = DatabaseOrTransaction;

// The one way to turn a household id that did not come from the session
// (a form field, a connection's default household) into a scope: only when
// the user holds a member row there. The row is key-share-locked, so inside
// the caller's transaction a leave or removal of that membership waits for
// the caller to commit instead of slipping in between check and write (#74),
// while role changes and ownership transfers are not held up.
export async function lockMembershipScope(
  db: Database,
  userId: string,
  householdId: string,
): Promise<HouseholdScope | null> {
  const [row] = await db
    .select({ householdId: member.organizationId })
    .from(member)
    .where(and(eq(member.userId, userId), eq(member.organizationId, householdId)))
    .limit(1)
    .for("key share");
  return row ? { householdId: row.householdId } : null;
}
