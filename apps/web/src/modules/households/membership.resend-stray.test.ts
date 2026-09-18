import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/platform/db/client";
import type { HouseholdSession } from "./require-household-session";

const createInvitationMock = vi.hoisted(() => vi.fn());
const cancelInvitationMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/auth", () => ({
  getAuth: () => ({
    api: { createInvitation: createInvitationMock, cancelInvitation: cancelInvitationMock },
  }),
  clearActiveHouseholdOnSessions: vi.fn(),
}));

const { resendInvitation } = await import("./membership");

const ownerSession: HouseholdSession = {
  userId: "owner-user",
  name: "Owner",
  email: "owner@example.com",
  householdId: "household-1",
  theme: "caderno",
};

function makeChain(result: unknown) {
  const chain = {
    from: () => chain,
    where: () => chain,
    limit: () => Promise.resolve(result),
    then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

// Mirrors resendInvitation's select sequence up to the stray-row branch:
// the eligible pending row, recentInvitationCount, the still-pending
// re-check, then the stray-row lookup itself returning one row.
function buildDb(): Database {
  const results = [
    [{ email: "member@example.com", role: "member", lastSentAt: null }],
    [{ total: 0 }],
    [{ status: "pending" }],
    [{ id: "stray-invitation-id" }],
  ];
  let call = 0;
  return {
    select: () => makeChain(results[call++]),
  } as unknown as Database;
}

describe("resendInvitation stray-row cleanup", () => {
  it("reports not_found without throwing when cancelling a stray row fails concurrently", async () => {
    createInvitationMock.mockResolvedValueOnce({});
    cancelInvitationMock.mockRejectedValueOnce(new Error("already accepted"));

    const outcome = await resendInvitation("invitation-1", ownerSession, buildDb(), new Headers());

    expect(outcome.status).toBe("not_found");
    expect(cancelInvitationMock).toHaveBeenCalledWith(
      expect.objectContaining({ body: { invitationId: "stray-invitation-id" } }),
    );
  });
});
