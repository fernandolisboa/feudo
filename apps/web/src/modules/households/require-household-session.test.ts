import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
);
const getCurrentSessionMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/modules/auth", () => ({ getCurrentSession: getCurrentSessionMock }));

import { requireHouseholdSession } from "./require-household-session";

beforeEach(() => {
  redirectMock.mockClear();
  getCurrentSessionMock.mockReset();
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
