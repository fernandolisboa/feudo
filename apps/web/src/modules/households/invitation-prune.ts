import { and, eq, lt, or } from "drizzle-orm";

import { invitation } from "@/modules/auth/schema";

import type { Database } from "@/platform/db/client";

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

export type DailyPruneStep = { deleted: number } | { error: string };

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}

export async function runDailyPruneStep(db: Database): Promise<DailyPruneStep> {
  try {
    const deleted = await pruneExpiredInvitations(db);
    return { deleted };
  } catch (error) {
    return { error: errorName(error) };
  }
}
