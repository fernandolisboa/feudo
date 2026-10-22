import { eq, sql } from "drizzle-orm";

import { user } from "./schema";

import type { Database } from "@/platform/db/client";

// Every auth email (verification, magic link, password reset) goes to an
// address that already has an account, so the quota lives on that user's
// row. Five an hour covers a person retrying a slow inbox; the IP limiter
// alone would let a caller rotating IPs flood one inbox and drain the
// provider's daily quota for every household.
export const AUTH_EMAIL_HOURLY_LIMIT = 5;
const AUTH_EMAIL_WINDOW_MS = 60 * 60_000;

// One UPDATE, so the row lock serializes concurrent requests for the same
// user: none can read "four sent" at the same instant as another and both
// send a sixth. A refused attempt still bumps the count, which never moves
// the window's start, so the window still closes an hour after its first
// send.
export async function reserveAuthEmail(
  db: Database,
  userId: string,
  now: Date = new Date(),
): Promise<boolean> {
  const windowOpen = sql`${user.authEmailWindowStartedAt} is not null and ${user.authEmailWindowStartedAt} > ${new Date(now.getTime() - AUTH_EMAIL_WINDOW_MS)}`;
  const [row] = await db
    .update(user)
    .set({
      authEmailCount: sql`case when ${windowOpen} then ${user.authEmailCount} + 1 else 1 end`,
      authEmailWindowStartedAt: sql`case when ${windowOpen} then ${user.authEmailWindowStartedAt} else ${now} end`,
      updatedAt: sql`${user.updatedAt}`,
    })
    .where(eq(user.id, userId))
    .returning({ count: user.authEmailCount });
  return row !== undefined && row.count <= AUTH_EMAIL_HOURLY_LIMIT;
}
