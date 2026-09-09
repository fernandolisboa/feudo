import type { CurrentSession } from "@/modules/auth";

export type HouseholdScope = { householdId: string };

export class NoActiveHouseholdError extends Error {
  constructor() {
    super("The session has no active household.");
    this.name = "NoActiveHouseholdError";
  }
}

// Takes the whole CurrentSession, not just { householdId }, so a scope can
// only ever be built from a real session read (getCurrentSession), never
// from an id passed around loose.
export function householdScope(session: CurrentSession): HouseholdScope {
  if (!session.householdId) {
    throw new NoActiveHouseholdError();
  }
  return { householdId: session.householdId };
}

// Module-private: the only legitimate callers are createHousehold, which has
// an organization id before the session reflects it as active, and this
// module's own tests, which seed households directly.
export function scopeForNewHousehold(householdId: string): HouseholdScope {
  return { householdId };
}
