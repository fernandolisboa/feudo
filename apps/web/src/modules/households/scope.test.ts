import { describe, expect, it } from "vitest";

import { NoActiveHouseholdError, householdScope } from "./scope";

describe("householdScope", () => {
  it("carries the session's active household id", () => {
    expect(householdScope({ householdId: "household-a" })).toEqual({
      householdId: "household-a",
    });
  });

  it("refuses a session with no active household", () => {
    expect(() => householdScope({ householdId: null })).toThrow(NoActiveHouseholdError);
  });
});
