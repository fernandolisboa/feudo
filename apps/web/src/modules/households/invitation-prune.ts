import { and, eq, lt, or } from "drizzle-orm";

import { invitation } from "@/db/schema";

import type { Database } from "@/db/client";

// ADR-0008: expired and cancelled invites are removed by the daily
// housekeeping job. Accepted and rejected rows stay — a rejected invite is
// evidence the invitee declined, and an accepted one is superseded by the
// membership it created, but neither is "expired or cancelled".
export async function pruneExpiredInvitations(db: Database): Promise<number> {
  const result = await db
    .delete(invitation)
    .where(
      or(
        eq(invitation.status, "canceled"),
        and(eq(invitation.status, "pending"), lt(invitation.expiresAt, new Date())),
      ),
    );
  return result.rowCount ?? 0;
}
