import { and, count, eq, gte, lt, sql } from "drizzle-orm";

import { organization, user } from "@/modules/auth/schema";
import type { HouseholdScope } from "@/modules/households";

import type { Database, DatabaseOrTransaction } from "@/platform/db/client";
import { aiKeyVerificationAttempt } from "./schema";

// A household sharing one Anthropic account can plausibly retype a key a
// few times in an hour; five is well above that and well below anything
// useful for probing Anthropic's own rate limits through Feudo.
export const HOUSEHOLD_HOURLY_LIMIT = 5;
const HOUSEHOLD_WINDOW_MS = 60 * 60_000;

// A single member mistyping a key repeatedly across a day is the normal
// case this still has to allow for; ten is the household's limit doubled,
// so no single member can exhaust the household's hour on their own without
// also tripping their own daily one first.
export const USER_DAILY_LIMIT = 10;
// Exported for prune.ts: the daily cron's cross-household sweep uses the
// same 24h cutoff as the user window, since no attempt still counts toward
// either limit past it (ADR-0008).
export const USER_WINDOW_MS = 24 * 60 * 60_000;

export type KeyVerificationReservation = { status: "reserved" } | { status: "rate_limited" };

// Used by prune.ts for the daily cron's cross-household sweep; the
// opportunistic delete inside reserve() above only ever touches the
// submitting household's own rows, so a household that attempts once and
// never again would otherwise keep its rows past their retention window.
export async function deleteAttemptsOlderThan(db: Database, cutoff: Date): Promise<number> {
  const result = await db
    .delete(aiKeyVerificationAttempt)
    .where(lt(aiKeyVerificationAttempt.attemptedAt, cutoff));
  return result.rowCount ?? 0;
}

// Every method is bound to the household taken from the session (ADR-0001):
// none accepts a household id.
export function createKeyVerificationAttemptRepository(scope: HouseholdScope) {
  async function countForHouseholdSince(db: DatabaseOrTransaction, since: Date): Promise<number> {
    const [row] = await db
      .select({ total: count() })
      .from(aiKeyVerificationAttempt)
      .where(
        and(
          eq(aiKeyVerificationAttempt.householdId, scope.householdId),
          gte(aiKeyVerificationAttempt.attemptedAt, since),
        ),
      );
    return row?.total ?? 0;
  }

  async function countForUserSince(
    db: DatabaseOrTransaction,
    userId: string,
    since: Date,
  ): Promise<number> {
    const [row] = await db
      .select({ total: count() })
      .from(aiKeyVerificationAttempt)
      .where(
        and(
          eq(aiKeyVerificationAttempt.userId, userId),
          gte(aiKeyVerificationAttempt.attemptedAt, since),
        ),
      );
    return row?.total ?? 0;
  }

  return {
    // Counting and inserting under a lock on the household's row, then the
    // user's own row, always in that order: two attempts for the same
    // household (by the same or different members) serialize on the
    // household lock first, so neither can read "under five" at the same
    // instant and both insert a sixth. A rejected attempt counts for
    // nothing — it is never written here, so it never reaches
    // provider.verifyKey either (the caller checks this before that call).
    async reserve(
      db: Database,
      input: { userId: string; now: Date },
    ): Promise<KeyVerificationReservation> {
      return db.transaction(async (tx) => {
        await tx.execute(sql`SET LOCAL lock_timeout = '5s'`);
        await tx
          .select({ id: organization.id })
          .from(organization)
          .where(eq(organization.id, scope.householdId))
          .for("no key update");
        const householdSince = new Date(input.now.getTime() - HOUSEHOLD_WINDOW_MS);
        const householdUsed = await countForHouseholdSince(tx, householdSince);
        if (householdUsed >= HOUSEHOLD_HOURLY_LIMIT) {
          return { status: "rate_limited" };
        }
        await tx
          .select({ id: user.id })
          .from(user)
          .where(eq(user.id, input.userId))
          .for("no key update");
        const userSince = new Date(input.now.getTime() - USER_WINDOW_MS);
        const userUsed = await countForUserSince(tx, input.userId, userSince);
        if (userUsed >= USER_DAILY_LIMIT) {
          return { status: "rate_limited" };
        }
        await tx.insert(aiKeyVerificationAttempt).values({
          householdId: scope.householdId,
          userId: input.userId,
          attemptedAt: input.now,
        });
        // Opportunistic: dropping this household's own rows older than the
        // wider of the two windows keeps the table from growing unbounded
        // without a separate prune job, at the cost this household's own
        // write pays for it.
        await tx
          .delete(aiKeyVerificationAttempt)
          .where(
            and(
              eq(aiKeyVerificationAttempt.householdId, scope.householdId),
              lt(aiKeyVerificationAttempt.attemptedAt, userSince),
            ),
          );
        return { status: "reserved" };
      });
    },
  };
}
