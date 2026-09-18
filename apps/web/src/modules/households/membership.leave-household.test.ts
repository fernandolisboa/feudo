import { APIError } from "better-auth/api";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/platform/db/client";
import type { HouseholdSession } from "./require-household-session";

const deleteOrganizationMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/auth", () => ({
  getAuth: () => ({ api: { deleteOrganization: deleteOrganizationMock } }),
  clearActiveHouseholdOnSessions: vi.fn(),
}));

const { leaveHousehold } = await import("./membership");

const ownerSession: HouseholdSession = {
  userId: "owner-user",
  name: "Owner",
  email: "owner@example.com",
  householdId: "household-1",
  theme: "caderno",
};

// Mirrors the two selects leaveHousehold's owner branch runs: activeMemberRow
// (select … limit(1)) outside any transaction, then the sole-member count
// (select … for("update")) inside one — good enough to reach the
// deleteOrganization call without a real database.
function buildDb(): Database {
  const topSelectChain = {
    from: () => topSelectChain,
    where: () => topSelectChain,
    limit: () => Promise.resolve([{ id: "member-owner", role: "owner" }]),
  };
  const txSelectChain = {
    from: () => txSelectChain,
    where: () => txSelectChain,
    for: () => Promise.resolve([{ id: "member-owner" }]),
  };
  return {
    select: () => topSelectChain,
    transaction: (fn: (tx: unknown) => Promise<boolean>) => fn({ select: () => txSelectChain }),
  } as unknown as Database;
}

describe("leaveHousehold hook error mapping", () => {
  it("maps beforeDeleteOrganization's household_has_other_members rejection to owner_must_transfer_first", async () => {
    deleteOrganizationMock.mockRejectedValueOnce(
      new APIError("BAD_REQUEST", { message: "household_has_other_members" }),
    );

    const outcome = await leaveHousehold(ownerSession, buildDb(), new Headers());

    expect(outcome.status).toBe("owner_must_transfer_first");
  });

  it("falls back to failed for any other deleteOrganization rejection", async () => {
    deleteOrganizationMock.mockRejectedValueOnce(new Error("boom"));

    const outcome = await leaveHousehold(ownerSession, buildDb(), new Headers());

    expect(outcome.status).toBe("failed");
  });
});
