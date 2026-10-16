import { beforeEach, describe, expect, it, vi } from "vitest";

const saveMock = vi.hoisted(() => vi.fn());
const removeKeyMock = vi.hoisted(() => vi.fn());

vi.mock("./ai-settings-repository", () => ({
  createAiSettingsRepository: () => ({ save: saveMock, removeKey: removeKeyMock }),
}));

import { encryptSecret } from "@/platform/crypto";

import type { AiProvider } from "./provider";
import { decryptHouseholdApiKey, removeAiKey, saveAiSettings } from "./ai-settings";

const SCOPE = { householdId: "household-1" };
const DB = {} as never;
const KEY = "unit-test-encryption-key-with-at-least-32-chars";

function provider(verifyKey: AiProvider["verifyKey"]): AiProvider {
  return { verifyKey, clientFor: () => null };
}

beforeEach(() => {
  saveMock.mockReset().mockResolvedValue(undefined);
  removeKeyMock.mockReset().mockResolvedValue(undefined);
});

describe("decryptHouseholdApiKey", () => {
  it("returns null when the household has no key", () => {
    expect(
      decryptHouseholdApiKey({ apiKeyCiphertext: null, apiKeyLast4: null } as never, KEY),
    ).toBeNull();
  });

  it("round-trips a stored key", () => {
    const settings = {
      apiKeyCiphertext: encryptSecret("sk-ant-secret", KEY),
      apiKeyLast4: "cret",
    } as never;

    expect(decryptHouseholdApiKey(settings, KEY)).toBe("sk-ant-secret");
  });

  it("treats a ciphertext the current key cannot open as no key, not a crash", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const settings = {
      apiKeyCiphertext: encryptSecret("sk-ant-secret", "a-different-key-of-32-chars!!!!!"),
      apiKeyLast4: "cret",
    } as never;

    expect(decryptHouseholdApiKey(settings, KEY)).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("saveAiSettings", () => {
  it("verifies a new key before ever storing it", async () => {
    const verifyKey = vi.fn().mockResolvedValue({ status: "ok" });

    const outcome = await saveAiSettings(SCOPE, DB, provider(verifyKey), KEY, {
      apiKey: "sk-ant-test-key",
      monthlyFamily: "opus",
      onDemandFamily: "sonnet",
      updatedByUserId: "user-1",
    });

    expect(outcome).toEqual({ status: "ok" });
    expect(verifyKey).toHaveBeenCalledWith("sk-ant-test-key");
    expect(saveMock).toHaveBeenCalledWith(DB, {
      apiKey: { ciphertext: expect.any(String) as unknown, last4: "-key" },
      monthlyFamily: "opus",
      onDemandFamily: "sonnet",
      updatedByUserId: "user-1",
    });
  });

  it("never stores an invalid key, and reports it as such", async () => {
    const verifyKey = vi.fn().mockResolvedValue({ status: "invalid" });

    const outcome = await saveAiSettings(SCOPE, DB, provider(verifyKey), KEY, {
      apiKey: "sk-ant-bad",
      monthlyFamily: "opus",
      onDemandFamily: "sonnet",
      updatedByUserId: "user-1",
    });

    expect(outcome).toEqual({ status: "invalid_key" });
    expect(saveMock).not.toHaveBeenCalled();
  });

  it("reports unavailable without storing anything when verification cannot run", async () => {
    const verifyKey = vi.fn().mockResolvedValue({ status: "unavailable" });

    const outcome = await saveAiSettings(SCOPE, DB, provider(verifyKey), KEY, {
      apiKey: "sk-ant-test",
      monthlyFamily: "opus",
      onDemandFamily: "sonnet",
      updatedByUserId: "user-1",
    });

    expect(outcome).toEqual({ status: "unavailable" });
    expect(saveMock).not.toHaveBeenCalled();
  });

  it("changes only the families, and never calls verifyKey, when the key is left unchanged", async () => {
    const verifyKey = vi.fn();

    const outcome = await saveAiSettings(SCOPE, DB, provider(verifyKey), KEY, {
      apiKey: null,
      monthlyFamily: "haiku",
      onDemandFamily: "haiku",
      updatedByUserId: "user-1",
    });

    expect(outcome).toEqual({ status: "ok" });
    expect(verifyKey).not.toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalledWith(DB, {
      apiKey: undefined,
      monthlyFamily: "haiku",
      onDemandFamily: "haiku",
      updatedByUserId: "user-1",
    });
  });
});

describe("removeAiKey", () => {
  it("delegates to the repository, scoped to the household", async () => {
    const outcome = await removeAiKey(SCOPE, DB, "user-1");

    expect(outcome).toEqual({ status: "ok" });
    expect(removeKeyMock).toHaveBeenCalledWith(DB, "user-1");
  });

  it("reports failed instead of throwing when the write fails", async () => {
    removeKeyMock.mockRejectedValue(new Error("boom"));

    expect(await removeAiKey(SCOPE, DB, "user-1")).toEqual({ status: "failed" });
  });
});
