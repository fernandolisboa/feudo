import { eq, lt, or } from "drizzle-orm";

import { invitation } from "@/modules/auth/schema";

import { errorName } from "@/lib/error-name";

import type { Database } from "@/platform/db/client";

// ADR-0008: the invitee's email is personal data, so it goes with the invite
// itself: cancelled or past its 24h expiry, whatever the status. Nothing reads
// an accepted or rejected row (the membership it created supersedes it, and
// every reader filters on pending and unexpired), so none is kept as evidence.
export async function pruneExpiredInvitations(db: Database): Promise<number> {
  const result = await db
    .delete(invitation)
    .where(or(eq(invitation.status, "canceled"), lt(invitation.expiresAt, new Date())));
  return result.rowCount ?? 0;
}

export type DailyPruneStep = { deleted: number } | { error: string };

export async function runDailyPruneStep(db: Database): Promise<DailyPruneStep> {
  try {
    const deleted = await pruneExpiredInvitations(db);
    return { deleted };
  } catch (error) {
    return { error: errorName(error) };
  }
}
