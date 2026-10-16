import { afterEach, describe, expect, it, vi } from "vitest";

const list = vi.fn<(params?: unknown) => Promise<unknown>>();

vi.mock("@anthropic-ai/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@anthropic-ai/sdk")>();
  class FakeAnthropic {
    static AuthenticationError = actual.AuthenticationError;
    static PermissionDeniedError = actual.PermissionDeniedError;
    models = { list };
  }
  return { ...actual, default: FakeAnthropic };
});

const { AuthenticationError, InternalServerError } = await import("@anthropic-ai/sdk");
const { createAiProvider } = await import("./provider");

afterEach(() => {
  list.mockReset();
});

describe("createAiProvider", () => {
  it("is null for the off provider: no key management at all", () => {
    expect(createAiProvider("off")).toBeNull();
  });

  describe("anthropic", () => {
    it("verifies a key against the Models API", async () => {
      list.mockResolvedValue({ data: [] });
      const provider = createAiProvider("anthropic");

      expect(await provider?.verifyKey("sk-ant-test")).toEqual({ status: "ok" });
      expect(list).toHaveBeenCalledWith({ limit: 1 });
    });

    it("reports an invalid key on 401/403", async () => {
      list.mockRejectedValue(new AuthenticationError(401, undefined, "bad key", new Headers()));
      const provider = createAiProvider("anthropic");

      expect(await provider?.verifyKey("sk-ant-bad")).toEqual({ status: "invalid" });
    });

    it("reports unavailable, not invalid, on a network or 5xx error", async () => {
      list.mockRejectedValue(new InternalServerError(500, undefined, "boom", new Headers()));
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const provider = createAiProvider("anthropic");

      expect(await provider?.verifyKey("sk-ant-test")).toEqual({ status: "unavailable" });
      warn.mockRestore();
    });

    it("has no client for a household with no key", () => {
      expect(createAiProvider("anthropic")?.clientFor(null)).toBeNull();
    });

    it("builds a real client for a household with a key", () => {
      expect(createAiProvider("anthropic")?.clientFor("sk-ant-test")).not.toBeNull();
    });
  });

  describe("fake", () => {
    it("accepts any non-blank key", async () => {
      const provider = createAiProvider("fake");
      expect(await provider?.verifyKey("anything")).toEqual({ status: "ok" });
      expect(await provider?.verifyKey("  ")).toEqual({ status: "invalid" });
    });

    it("hands out a working client regardless of the key, even null", () => {
      const provider = createAiProvider("fake");
      expect(provider?.clientFor(null)).not.toBeNull();
      expect(provider?.clientFor("sk-ant-test")).not.toBeNull();
    });
  });
});
