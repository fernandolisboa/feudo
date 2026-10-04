import { eq, sql } from "drizzle-orm";

import type { HouseholdSession } from "@/modules/households";
import { user } from "@/modules/auth/schema";

import { getDb } from "@/platform/db/client";
import {
  createFinancialDataAccessRepository,
  RECENT_ACCESS_LIMIT,
  type FinancialDataAccessExportRow,
} from "./repository";
import { financialDataAccessScope } from "./scope";

import type { FinancialDataKind } from "./schema";

// Called from the server boundary of every financial-data read (ADR-0008),
// after that read has already succeeded (amended 2026-10-03, #27): the
// overview, transactions, categories and reserve page-props functions.
// A read under a quota goes through recordAccessWithinQuota instead. Household and
// user always come from the session, never from a caller-supplied id — a
// caller cannot record an access into a household it does not hold a
// session for. A failed read records nothing; a failed audit write still
// fails the call that read the data, so a read is never served unwitnessed.
//
// A read of the same kind by the same person in the same household within
// SAME_ACCESS_WINDOW_SECONDS of a recorded one is the same access (amended
// 2026-10-04, #28): right after an in-app navigation the service worker
// fetches the screen's page again to keep its offline copy (ADR-0007), and
// that second read would otherwise show up twice in "Seus acessos recentes".
// Every read is still witnessed by a row at most that far from it.
export const SAME_ACCESS_WINDOW_SECONDS = 60;

export async function recordFinancialDataAccess(
  session: HouseholdSession,
  kind: FinancialDataKind,
): Promise<void> {
  const db = getDb();
  await createFinancialDataAccessRepository(financialDataAccessScope(session)).recordUnlessRecent(
    db,
    kind,
    SAME_ACCESS_WINDOW_SECONDS,
  );
}

export type RecentAccessEntry = {
  id: string;
  kind: FinancialDataKind;
  accessedAt: Date;
};

// The viewer's own recent access in the active household, most recent
// first — never another member's (CONTEXT.md/ADR-0008: the household page
// shows "Seus acessos recentes", not the household's).
export async function listRecentFinancialDataAccess(
  session: HouseholdSession,
  limit: number = RECENT_ACCESS_LIMIT,
): Promise<RecentAccessEntry[]> {
  const db = getDb();
  return createFinancialDataAccessRepository(financialDataAccessScope(session)).listRecentForUser(
    db,
    limit,
  );
}

export type QuotaOutcome<T> = { status: "ok"; value: T } | { status: "limited" };

// A per-user quota on top of financial_data_access, for callers like the
// data export (#25, ADR-0008) whose own write IS the audit row: count, read
// and insert must happen as one atomic step, or a burst of concurrent
// requests can all read "under the limit" and all get through. Locking the
// session user's own row (the same pattern as sync's manual-sync quota,
// sync/repository.ts's `reserve`) serializes every call for that user, and
// the lock is held for the whole read. `read` runs on the global pool, so a
// burst of waiters can fill the pool while the holder's read waits for a
// connection; the lock timeout makes those waiters fail and release theirs
// instead of hanging the instance. ADR-0008's order holds: a read that
// throws never reaches the insert, the insert's last before the commit.
export async function recordAccessWithinQuota<T>(
  session: HouseholdSession,
  kind: FinancialDataKind,
  quota: { limit: number; since: Date },
  read: () => Promise<T>,
): Promise<QuotaOutcome<T>> {
  const repository = createFinancialDataAccessRepository(financialDataAccessScope(session));
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL lock_timeout = '5s'`);
    await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, session.userId))
      .for("no key update");
    const used = await repository.countSince(tx, kind, quota.since);
    if (used >= quota.limit) {
      return { status: "limited" };
    }
    const value = await read();
    await repository.record(tx, kind);
    return { status: "ok", value };
  });
}

export type { FinancialDataAccessExportRow };

// The export's own financialDataAccess section: every access the session's
// user triggered, across every household (#25) — never another member's.
export async function listFinancialDataAccessForExport(
  session: HouseholdSession,
): Promise<FinancialDataAccessExportRow[]> {
  const db = getDb();
  return createFinancialDataAccessRepository(financialDataAccessScope(session)).listAllForUser(db);
}
