import { describe, expect, it } from "vitest";

import {
  FakeAiProviderInProductionError,
  InvalidAiProviderError,
  MissingEncryptionKeyError,
  readAiProviderName,
  readEncryptionKey,
} from "./env";

const LONG_ENOUGH = "x".repeat(32);

describe("readAiProviderName", () => {
  it("defaults to anthropic once ENCRYPTION_KEY is set, since the key now lives per household", () => {
    expect(readAiProviderName({ ENCRYPTION_KEY: LONG_ENOUGH })).toBe("anthropic");
  });

  it("is off without ENCRYPTION_KEY, so no household key can ever be decrypted", () => {
    expect(readAiProviderName({})).toBe("off");
    expect(readAiProviderName({ ENCRYPTION_KEY: "  " })).toBe("off");
  });

  it("stays off when anthropic is asked for but ENCRYPTION_KEY is missing", () => {
    expect(readAiProviderName({ AI_PROVIDER: "anthropic" })).toBe("off");
  });

  it("lets AI_PROVIDER=off turn the analyst off even with ENCRYPTION_KEY set", () => {
    expect(readAiProviderName({ AI_PROVIDER: "off", ENCRYPTION_KEY: LONG_ENOUGH })).toBe("off");
  });

  it("accepts the fake outside production, with no ENCRYPTION_KEY at all", () => {
    expect(readAiProviderName({ AI_PROVIDER: "fake", VERCEL_ENV: "preview" })).toBe("fake");
  });

  it("refuses the fake in production", () => {
    expect(() => readAiProviderName({ AI_PROVIDER: "fake", VERCEL_ENV: "production" })).toThrow(
      FakeAiProviderInProductionError,
    );
  });

  it("rejects an unknown provider", () => {
    expect(() => readAiProviderName({ AI_PROVIDER: "openai" })).toThrow(InvalidAiProviderError);
  });
});

describe("readEncryptionKey", () => {
  it("returns the configured key", () => {
    expect(readEncryptionKey({ ENCRYPTION_KEY: LONG_ENOUGH })).toBe(LONG_ENOUGH);
  });

  it("throws when missing or too short", () => {
    expect(() => readEncryptionKey({})).toThrow(MissingEncryptionKeyError);
    expect(() => readEncryptionKey({ ENCRYPTION_KEY: "short" })).toThrow(MissingEncryptionKeyError);
  });
});
