import { afterEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();

vi.mock("@vercel/global-config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@vercel/global-config")>();
  return {
    ...actual,
    createClient: vi.fn(() => ({ get: getMock })),
  };
});

const { createRuntimeSettings, InvalidGlobalConfigConnectionError } =
  await import("./runtime-settings");

const CONNECTION_STRING = "https://global-config.vercel.com/ecfg_test?token=tok_test";

afterEach(() => {
  getMock.mockReset();
  vi.restoreAllMocks();
});

describe("createRuntimeSettings", () => {
  it("reads nothing when GLOBAL_CONFIG is unset or empty", async () => {
    expect(await createRuntimeSettings({}).read("registration_mode")).toBeUndefined();
    expect(
      await createRuntimeSettings({ GLOBAL_CONFIG: "" }).read("registration_mode"),
    ).toBeUndefined();
    expect(getMock).not.toHaveBeenCalled();
  });

  it("throws when GLOBAL_CONFIG is not a connection string", () => {
    expect(() => createRuntimeSettings({ GLOBAL_CONFIG: "not-a-connection-string" })).toThrow(
      InvalidGlobalConfigConnectionError,
    );
  });

  it("returns the stored value for a key", async () => {
    getMock.mockResolvedValueOnce("open");

    const settings = createRuntimeSettings({ GLOBAL_CONFIG: CONNECTION_STRING });

    expect(await settings.read("registration_mode")).toBe("open");
    expect(getMock).toHaveBeenCalledWith("registration_mode");
  });

  it("returns undefined and logs only the error name when the store read fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    getMock.mockRejectedValueOnce(new Error("token=secret leaked"));

    const settings = createRuntimeSettings({ GLOBAL_CONFIG: CONNECTION_STRING });

    expect(await settings.read("registration_mode")).toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith("Global Config read failed", {
      key: "registration_mode",
      name: "Error",
    });
  });
});
