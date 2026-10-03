import { householdScope, type HouseholdSession } from "@/modules/households";

export type FinancialDataAccessScope = { householdId: string; userId: string };

// Mirrors households.householdScope and sync.userScope (ADR-0001): takes
// the whole session, never a loose id, so a scope can only ever come from a
// real session read. record() and listRecentForUser() close over this
// instead of taking a userId parameter, so a caller can neither write nor
// read another member's access.
export function financialDataAccessScope(session: HouseholdSession): FinancialDataAccessScope {
  return { ...householdScope(session), userId: session.userId };
}
