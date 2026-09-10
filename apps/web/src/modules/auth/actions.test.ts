import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
);
const signOutMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({ headers: () => Promise.resolve(new Headers()) }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("./service", () => ({ signOut: signOutMock }));

import { signOutAction } from "./actions";
import { t } from "./strings";

beforeEach(() => {
  redirectMock.mockClear();
  signOutMock.mockReset();
});

describe("signOutAction", () => {
  it("returns an error ActionState instead of redirecting when signOut fails", async () => {
    signOutMock.mockResolvedValue({ status: "failed" });

    const result = await signOutAction();

    expect(result).toEqual({ status: "error", message: t.errors.signOutFailed });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects to sign in when signOut succeeds", async () => {
    signOutMock.mockResolvedValue({ status: "ok" });

    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT:/entrar");
  });
});
