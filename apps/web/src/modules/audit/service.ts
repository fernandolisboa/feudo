import type { HouseholdSession } from "@/modules/households";

import { getDb } from "@/platform/db/client";
import { createFinancialDataAccessRepository, RECENT_ACCESS_LIMIT } from "./repository";
import { financialDataAccessScope } from "./scope";

import type { FinancialDataKind } from "./schema";

// Called from the server boundary of every financial-data read (ADR-0008),
// after that read has already succeeded (amended 2026-10-03, #27): the
// overview, transactions, categories and reserve page-props functions
// today, and future callers like an export endpoint (#25). Household and
// user always come from the session, never from a caller-supplied id — a
// caller cannot record an access into a household it does not hold a
// session for. A failed read records nothing; a failed audit write still
// fails the call that read the data, so a read is never served unwitnessed.
export async function recordFinancialDataAccess(
  session: HouseholdSession,
  kind: FinancialDataKind,
): Promise<void> {
  const db = getDb();
  await createFinancialDataAccessRepository(financialDataAccessScope(session)).record(db, kind);
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
