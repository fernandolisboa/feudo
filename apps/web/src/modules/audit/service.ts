import { householdScope, type HouseholdSession } from "@/modules/households";

import { getDb } from "@/platform/db/client";
import { createFinancialDataAccessRepository, RECENT_ACCESS_LIMIT } from "./repository";

import type { FinancialDataKind } from "./schema";

// Called from the server boundary of every financial-data read (ADR-0008):
// the overview, transactions and reserve page-props functions today, and
// future callers like an export endpoint. Household and user always come
// from the session, never from a caller-supplied id — a caller cannot
// record an access into a household it does not hold a session for. Callers
// run this concurrently with their own read (Promise.all) and await both:
// a failed audit write fails the read too, so a read is never served
// unwitnessed.
export async function recordFinancialDataAccess(
  session: HouseholdSession,
  kind: FinancialDataKind,
): Promise<void> {
  const db = getDb();
  await createFinancialDataAccessRepository(householdScope(session)).record(
    db,
    session.userId,
    kind,
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
  return createFinancialDataAccessRepository(householdScope(session)).listRecentForUser(
    db,
    session.userId,
    limit,
  );
}
