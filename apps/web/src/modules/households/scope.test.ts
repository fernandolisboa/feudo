import { describe, expect, it } from "vitest";

import type { CurrentSession } from "@/modules/auth";

import { NoActiveHouseholdError, householdScope } from "./scope";

function fakeSession(householdId: string | null): CurrentSession {
  return { userId: "user-1", name: "Ada", email: "ada@example.com", householdId };
}

describe("householdScope", () => {
  it("carries the session's active household id", () => {
    expect(householdScope(fakeSession("household-a"))).toEqual({
      householdId: "household-a",
    });
  });

  it("refuses a session with no active household", () => {
    expect(() => householdScope(fakeSession(null))).toThrow(NoActiveHouseholdError);
  });
});
