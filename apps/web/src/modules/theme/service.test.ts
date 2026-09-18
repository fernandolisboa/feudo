import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSessionMock = vi.hoisted(() => vi.fn());
const setUserThemeMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/auth", () => ({ getCurrentSession: getCurrentSessionMock }));
vi.mock("@/platform/db/client", () => ({ getDb: () => "db" }));
vi.mock("./repository", () => ({ setUserTheme: setUserThemeMock }));

import { updateTheme } from "./service";

beforeEach(() => {
  getCurrentSessionMock.mockReset();
  setUserThemeMock.mockReset();
  setUserThemeMock.mockResolvedValue(undefined);
});

describe("updateTheme", () => {
  it("returns unauthenticated and writes nothing when there is no session", async () => {
    getCurrentSessionMock.mockResolvedValue(null);

    const outcome = await updateTheme({ theme: "painel" });

    expect(outcome).toEqual({ status: "unauthenticated" });
    expect(setUserThemeMock).not.toHaveBeenCalled();
  });

  it("returns invalid_theme and writes nothing for an unknown theme", async () => {
    getCurrentSessionMock.mockResolvedValue({
      userId: "user-1",
      name: "Ana",
      email: "ana@example.com",
    });

    const outcome = await updateTheme({ theme: "neon" });

    expect(outcome).toEqual({ status: "invalid_theme" });
    expect(setUserThemeMock).not.toHaveBeenCalled();
  });

  it("writes the theme scoped to the session's own user id", async () => {
    getCurrentSessionMock.mockResolvedValue({
      userId: "user-1",
      name: "Ana",
      email: "ana@example.com",
    });

    const outcome = await updateTheme({ theme: "painel" });

    expect(outcome).toEqual({ status: "ok" });
    expect(setUserThemeMock).toHaveBeenCalledWith("db", "user-1", "painel");
  });

  it("ignores a userId supplied in the input and always uses the session's user id", async () => {
    getCurrentSessionMock.mockResolvedValue({
      userId: "user-1",
      name: "Ana",
      email: "ana@example.com",
    });

    await updateTheme({ theme: "sala", userId: "user-2" });

    expect(setUserThemeMock).toHaveBeenCalledWith("db", "user-1", "sala");
  });
});
