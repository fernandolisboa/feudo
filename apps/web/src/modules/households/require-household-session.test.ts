import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
);
const getCurrentSessionMock = vi.hoisted(() => vi.fn());
const getPendingAccountDeletionMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/modules/auth", () => ({
  ACCOUNT_DELETION_PENDING_ROUTE: "/exclusao-agendada",
  getCurrentSession: getCurrentSessionMock,
  getPendingAccountDeletion: getPendingAccountDeletionMock,
  redirectIfAccountDeletionPending: async (session: unknown) => {
    if (!session && (await getPendingAccountDeletionMock())) {
      redirectMock("/exclusao-agendada");
    }
  },
}));

import { requireHouseholdSession } from "./require-household-session";

beforeEach(() => {
  redirectMock.mockClear();
  getCurrentSessionMock.mockReset();
  getPendingAccountDeletionMock.mockReset();
  getPendingAccountDeletionMock.mockResolvedValue(null);
});

describe("requireHouseholdSession", () => {
  it("returns the session when it has an active household", async () => {
    getCurrentSessionMock.mockResolvedValue({
      userId: "user-1",
      name: "Ada",
      email: "ada@example.com",
      householdId: "household-a",
    });

    const session = await requireHouseholdSession();

    expect(session.householdId).toBe("household-a");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects to sign in when there is no session", async () => {
    getCurrentSessionMock.mockResolvedValue(null);

    await expect(requireHouseholdSession()).rejects.toThrow("NEXT_REDIRECT:/entrar");
  });

  it("sends a user whose account deletion is pending to the cancel page", async () => {
    getCurrentSessionMock.mockResolvedValue(null);
    getPendingAccountDeletionMock.mockResolvedValue({
      userId: "user-1",
      name: "Ada",
      email: "ada@example.com",
      deletionRequestedAt: new Date("2026-10-03T18:00:00Z"),
    });

    await expect(requireHouseholdSession()).rejects.toThrow("NEXT_REDIRECT:/exclusao-agendada");
  });

  it("redirects to onboarding when the session has no active household", async () => {
    getCurrentSessionMock.mockResolvedValue({
      userId: "user-1",
      name: "Ada",
      email: "ada@example.com",
      householdId: null,
    });

    await expect(requireHouseholdSession()).rejects.toThrow("NEXT_REDIRECT:/comecar");
  });
});
