import { beforeEach, describe, expect, it, vi } from "vitest";

const saveMock = vi.hoisted(() => vi.fn());
const removeKeyMock = vi.hoisted(() => vi.fn());
const reserveMock = vi.hoisted(() => vi.fn());

vi.mock("./ai-settings-repository", () => ({
  createAiSettingsRepository: () => ({ save: saveMock, removeKey: removeKeyMock }),
}));
vi.mock("./key-verification-attempts", () => ({
  createKeyVerificationAttemptRepository: () => ({ reserve: reserveMock }),
}));

import { encryptSecret, HOUSEHOLD_AI_KEY_PURPOSE } from "@/platform/crypto";

import type { AiProvider } from "./provider";
import {
  decryptHouseholdApiKey,
  householdHasUsableKey,
  removeAiKey,
  saveAiSettings,
} from "./ai-settings";

const SCOPE = { householdId: "household-1" };
const DB = {} as never;
const KEY = "unit-test-encryption-key-with-at-least-32-chars";

function provider(verifyKey: AiProvider["verifyKey"]): AiProvider {
  return { verifyKey, clientFor: () => null };
}

beforeEach(() => {
  saveMock.mockReset().mockResolvedValue(undefined);
  removeKeyMock.mockReset().mockResolvedValue(undefined);
  reserveMock.mockReset().mockResolvedValue({ status: "reserved" });
});

describe("decryptHouseholdApiKey", () => {
  it("returns null when the household has no key", () => {
    expect(
      decryptHouseholdApiKey({ apiKeyCiphertext: null, apiKeyLast4: null } as never, KEY),
    ).toBeNull();
  });

  it("round-trips a stored key", () => {
    const settings = {
      apiKeyCiphertext: encryptSecret("sk-ant-secret", KEY, HOUSEHOLD_AI_KEY_PURPOSE),
      apiKeyLast4: "cret",
    } as never;

    expect(decryptHouseholdApiKey(settings, KEY)).toBe("sk-ant-secret");
  });

  it("treats a ciphertext the current key cannot open as no key, not a crash", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const settings = {
      apiKeyCiphertext: encryptSecret(
        "sk-ant-secret",
        "a-different-key-of-32-chars!!!!!",
        HOUSEHOLD_AI_KEY_PURPOSE,
      ),
      apiKeyLast4: "cret",
    } as never;

    expect(decryptHouseholdApiKey(settings, KEY)).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("householdHasUsableKey", () => {
  it("is false with no encryption key at all (the deploy cannot open anything)", () => {
    const settings = {
      apiKeyCiphertext: encryptSecret("sk-ant-secret", KEY, HOUSEHOLD_AI_KEY_PURPOSE),
      apiKeyLast4: "cret",
    } as never;

    expect(householdHasUsableKey(settings, null)).toBe(false);
  });

  it("is false when the household registered no key", () => {
    expect(householdHasUsableKey({ apiKeyCiphertext: null, apiKeyLast4: null } as never, KEY)).toBe(
      false,
    );
  });

  it("is false for a ciphertext this deploy's key cannot open, same as no key", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const settings = {
      apiKeyCiphertext: encryptSecret(
        "sk-ant-secret",
        "a-different-key-of-32-chars!!!!!",
        HOUSEHOLD_AI_KEY_PURPOSE,
      ),
      apiKeyLast4: "cret",
    } as never;

    expect(householdHasUsableKey(settings, KEY)).toBe(false);
    warn.mockRestore();
  });

  it("is true for a key this deploy can decrypt", () => {
    const settings = {
      apiKeyCiphertext: encryptSecret("sk-ant-secret", KEY, HOUSEHOLD_AI_KEY_PURPOSE),
      apiKeyLast4: "cret",
    } as never;

    expect(householdHasUsableKey(settings, KEY)).toBe(true);
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

  it("never calls verifyKey or saves anything once the verification rate limit is hit", async () => {
    reserveMock.mockResolvedValue({ status: "rate_limited" });
    const verifyKey = vi.fn();

    const outcome = await saveAiSettings(SCOPE, DB, provider(verifyKey), KEY, {
      apiKey: "sk-ant-test-key",
      monthlyFamily: "opus",
      onDemandFamily: "sonnet",
      updatedByUserId: "user-1",
    });

    expect(outcome).toEqual({ status: "rate_limited" });
    expect(verifyKey).not.toHaveBeenCalled();
    expect(saveMock).not.toHaveBeenCalled();
  });

  it("reserves a verification attempt for the submitting user before verifying a new key", async () => {
    const verifyKey = vi.fn().mockResolvedValue({ status: "ok" });

    await saveAiSettings(SCOPE, DB, provider(verifyKey), KEY, {
      apiKey: "sk-ant-test-key",
      monthlyFamily: "opus",
      onDemandFamily: "sonnet",
      updatedByUserId: "user-1",
    });

    expect(reserveMock).toHaveBeenCalledWith(DB, {
      userId: "user-1",
      now: expect.any(Date) as Date,
    });
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
    expect(reserveMock).not.toHaveBeenCalled();
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
