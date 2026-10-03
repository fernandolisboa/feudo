import { and, asc, eq, isNotNull, isNull, lte, or } from "drizzle-orm";

import type { CurrentSession, PendingAccountDeletion } from "@/modules/auth";
import { user } from "@/modules/auth/schema";

import type { Database, DatabaseOrTransaction } from "@/platform/db/client";

// Only a user with no pending request is marked, so a repeated request never
// pushes the purge date further out.
export async function markAccountForDeletion(
  db: DatabaseOrTransaction,
  session: CurrentSession,
  now: Date,
): Promise<boolean> {
  const marked = await db
    .update(user)
    .set({ deletionRequestedAt: now })
    .where(and(eq(user.id, session.userId), isNull(user.deletionRequestedAt)))
    .returning({ id: user.id });
  return marked.length === 1;
}

// At most one round of emails to the other members per grace window: a user
// who cancels and asks again within it does not email everyone again.
export async function claimMemberNotices(
  db: DatabaseOrTransaction,
  session: CurrentSession,
  now: Date,
  previousCutoff: Date,
): Promise<boolean> {
  const claimed = await db
    .update(user)
    .set({ deletionNoticesSentAt: now })
    .where(
      and(
        eq(user.id, session.userId),
        or(isNull(user.deletionNoticesSentAt), lte(user.deletionNoticesSentAt, previousCutoff)),
      ),
    )
    .returning({ id: user.id });
  return claimed.length === 1;
}

export async function clearAccountDeletion(
  db: Database,
  pending: PendingAccountDeletion,
): Promise<boolean> {
  const cleared = await db
    .update(user)
    .set({ deletionRequestedAt: null })
    .where(and(eq(user.id, pending.userId), isNotNull(user.deletionRequestedAt)))
    .returning({ id: user.id });
  return cleared.length === 1;
}

// Job-only enumeration (ADR-0001): read only by runAccountPurgeStep.
export async function listAccountsDueForDeletion(db: Database, cutoff: Date): Promise<string[]> {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(lte(user.deletionRequestedAt, cutoff))
    .orderBy(asc(user.deletionRequestedAt));
  return rows.map((row) => row.id);
}

// Re-checked under the row lock: a cancel that committed after the job read
// its list leaves nothing to purge, and one that arrives later waits for the
// purge and then finds no row.
export async function lockAccountDueForDeletion(
  tx: DatabaseOrTransaction,
  userId: string,
  cutoff: Date,
): Promise<boolean> {
  const rows = await tx
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.id, userId), lte(user.deletionRequestedAt, cutoff)))
    .for("update");
  return rows.length === 1;
}

export async function deleteUser(tx: DatabaseOrTransaction, userId: string): Promise<void> {
  await tx.delete(user).where(eq(user.id, userId));
}
