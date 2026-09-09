export type HouseholdScope = { householdId: string };

export class NoActiveHouseholdError extends Error {
  constructor() {
    super("The session has no active household.");
    this.name = "NoActiveHouseholdError";
  }
}

export function householdScope(session: { householdId: string | null }): HouseholdScope {
  if (!session.householdId) {
    throw new NoActiveHouseholdError();
  }
  return { householdId: session.householdId };
}
