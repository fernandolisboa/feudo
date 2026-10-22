import { eq, sql } from "drizzle-orm";

import { user } from "./schema";

import type { Database } from "@/platform/db/client";

// Two per-user hourly email ceilings, counted on the user row:
// - auth: every auth email (verification, magic link, password reset) goes to
//   an address that already has an account, so the quota is the recipient's.
//   Five an hour covers a person retrying a slow inbox; the IP limiter alone
//   would let a caller rotating IPs flood one inbox and drain the provider's
//   daily quota for every household.
// - invitation: counted on the inviter, once per call to invite-member,
//   resend included, since Better Auth's resend sends again without a new
//   row. A household is a small pool of people, not a mailing list: 20 an
//   hour is generous headroom for onboarding one.
export const EMAIL_QUOTA_LIMITS = { auth: 5, invitation: 20 } as const;
export type EmailQuota = keyof typeof EMAIL_QUOTA_LIMITS;
const EMAIL_QUOTA_WINDOW_MS = 60 * 60_000;

const QUOTA_COLUMNS = {
  auth: { windowStartedAt: "authEmailWindowStartedAt", count: "authEmailCount" },
  invitation: { windowStartedAt: "invitationEmailWindowStartedAt", count: "invitationEmailCount" },
} as const;

// One UPDATE, so the row lock serializes concurrent requests for the same
// user: none can read "four sent" at the same instant as another and both
// send a sixth. A refused attempt still bumps the count, which never moves
// the window's start, so the window still closes an hour after its first
// send.
export async function reserveEmailQuota(
  db: Database,
  userId: string,
  quota: EmailQuota,
  now: Date = new Date(),
): Promise<boolean> {
  const keys = QUOTA_COLUMNS[quota];
  const windowStartedAt = user[keys.windowStartedAt];
  const sent = user[keys.count];
  const windowOpen = sql`${windowStartedAt} is not null and ${windowStartedAt} > ${new Date(now.getTime() - EMAIL_QUOTA_WINDOW_MS)}`;
  const [row] = await db
    .update(user)
    .set({
      [keys.count]: sql`case when ${windowOpen} then ${sent} + 1 else 1 end`,
      [keys.windowStartedAt]: sql`case when ${windowOpen} then ${windowStartedAt} else ${now} end`,
      // Keeps $onUpdate from stamping updatedAt: sending an email is not an
      // edit of the account.
      updatedAt: sql`${user.updatedAt}`,
    })
    .where(eq(user.id, userId))
    .returning({ count: sent });
  return row !== undefined && row.count <= EMAIL_QUOTA_LIMITS[quota];
}
