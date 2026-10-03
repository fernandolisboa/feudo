import { and, asc, eq, isNotNull, isNull, lte, or } from "drizzle-orm";

import type { CurrentSession, PendingAccountDeletion } from "@/modules/auth";
import { session as sessionTable, user } from "@/modules/auth/schema";

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

export type ExportUserRow = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  termsVersion: string;
  termsAcceptedAt: Date;
  theme: string;
};

// The export's own "user" section (#25): read directly off auth's schema,
// like theme's own repository does for the same table — this slice composes
// the export document, so it owns the one query nothing else here already
// exposes.
export async function getExportUser(
  db: DatabaseOrTransaction,
  userId: string,
): Promise<ExportUserRow | undefined> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      termsVersion: user.termsVersion,
      termsAcceptedAt: user.termsAcceptedAt,
      theme: user.theme,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return rows[0];
}

export type ExportSessionRow = {
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

// The export's own "sessions" section (#25): every sign-in session the
// policy says Feudo keeps for this user, read directly off auth's schema —
// never the token, which is the one column that would let the file itself
// sign in as the user.
export async function listExportSessions(
  db: DatabaseOrTransaction,
  userId: string,
): Promise<ExportSessionRow[]> {
  return db
    .select({
      createdAt: sessionTable.createdAt,
      updatedAt: sessionTable.updatedAt,
      expiresAt: sessionTable.expiresAt,
      ipAddress: sessionTable.ipAddress,
      userAgent: sessionTable.userAgent,
    })
    .from(sessionTable)
    .where(eq(sessionTable.userId, userId));
}
