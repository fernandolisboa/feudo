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
  redirectIfTermsOutdated: (session: { termsVersion: string }) => {
    if (session.termsVersion !== CURRENT_TERMS) {
      redirectMock("/aceitar-termos");
    }
  },
}));

import {
  requireHouseholdSession,
  requireHouseholdSessionForDataRights,
} from "./require-household-session";

const CURRENT_TERMS = "2026-10-03";

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
      termsVersion: CURRENT_TERMS,
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
      termsVersion: CURRENT_TERMS,
    });

    await expect(requireHouseholdSession()).rejects.toThrow("NEXT_REDIRECT:/comecar");
  });

  it("sends a user who accepted an older version of the terms to accept the current one", async () => {
    getCurrentSessionMock.mockResolvedValue({
      userId: "user-1",
      name: "Ada",
      email: "ada@example.com",
      householdId: "household-a",
      termsVersion: "2026-09-09",
    });

    await expect(requireHouseholdSession()).rejects.toThrow("NEXT_REDIRECT:/aceitar-termos");
  });
});

describe("requireHouseholdSessionForDataRights", () => {
  it("lets a user with outdated terms through, since exporting data is a right", async () => {
    getCurrentSessionMock.mockResolvedValue({
      userId: "user-1",
      name: "Ada",
      email: "ada@example.com",
      householdId: "household-a",
      termsVersion: "2026-09-09",
    });

    const session = await requireHouseholdSessionForDataRights();

    expect(session.householdId).toBe("household-a");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("still redirects a signed-out visitor to sign in", async () => {
    getCurrentSessionMock.mockResolvedValue(null);

    await expect(requireHouseholdSessionForDataRights()).rejects.toThrow("NEXT_REDIRECT:/entrar");
  });
});
