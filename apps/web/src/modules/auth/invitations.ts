import { and, count, eq, gt, or, sql } from "drizzle-orm";

import { invitation } from "./schema";

import type { Database } from "@/platform/db/client";

// A household is a small pool of people, not a mailing list: 20 invites in
// an hour is already generous headroom for onboarding a real household and
// keeps a compromised session from spraying invitation emails.
export const INVITE_HOURLY_LIMIT = 20;
export const INVITATION_RATE_LIMITED_CODE = "INVITATION_RATE_LIMITED";

export async function hasPendingInvitation(db: Database, email: string): Promise<boolean> {
  const rows = await db
    .select({ id: invitation.id })
    .from(invitation)
    .where(
      and(
        eq(sql`lower(${invitation.email})`, email.trim().toLowerCase()),
        eq(invitation.status, "pending"),
        gt(invitation.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

// A row counts toward the ceiling if it was either created or last sent
// within the hour: createdAt alone would let an old invitation be resent
// indefinitely once it ages out of the window, since resend (resend: true)
// only ever bumps expiresAt on the existing row, never createdAt.
export async function countRecentInvitationsBy(db: Database, inviterId: string): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [row] = await db
    .select({ total: count() })
    .from(invitation)
    .where(
      and(
        eq(invitation.inviterId, inviterId),
        or(gt(invitation.createdAt, oneHourAgo), gt(invitation.lastSentAt, oneHourAgo)),
      ),
    );
  return row?.total ?? 0;
}
