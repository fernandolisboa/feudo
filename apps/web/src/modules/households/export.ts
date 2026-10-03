import { eq } from "drizzle-orm";

import type { CurrentSession } from "@/modules/auth";
import { member, organization } from "@/modules/auth/schema";

import { getDb } from "@/platform/db/client";
import type { HouseholdRole } from "./membership";

export type HouseholdMembershipExportRow = {
  householdId: string;
  name: string;
  role: HouseholdRole;
  joinedAt: Date;
  deletionPending: boolean;
};

// The LGPD export's own reader (#25): every household the session's user
// belongs to, including one pending deletion (unlike every other households
// read, which hides it) — the export shows the user their own membership
// state exactly as it is, never another member's.
export async function getHouseholdMembershipsForExport(
  session: CurrentSession,
): Promise<HouseholdMembershipExportRow[]> {
  const rows = await getDb()
    .select({
      householdId: member.organizationId,
      name: organization.name,
      role: member.role,
      joinedAt: member.createdAt,
      deletionRequestedAt: organization.deletionRequestedAt,
    })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(eq(member.userId, session.userId));

  return rows.map((row) => ({
    householdId: row.householdId,
    name: row.name,
    role: row.role as HouseholdRole,
    joinedAt: row.joinedAt,
    deletionPending: row.deletionRequestedAt !== null,
  }));
}
