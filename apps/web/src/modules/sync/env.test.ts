import { describe, expect, it } from "vitest";

import {
  FakeDataProviderInProductionError,
  InvalidDataProviderError,
  MissingSecretError,
  readDataProviderName,
  readDocumentHashKey,
  readEncryptionKey,
} from "./env";

const LONG_ENOUGH = "x".repeat(32);

describe("readDataProviderName", () => {
  it("defaults to pluggy", () => {
    expect(readDataProviderName({})).toBe("pluggy");
    expect(readDataProviderName({ DATA_PROVIDER: "" })).toBe("pluggy");
  });

  it("accepts fake outside production", () => {
    expect(readDataProviderName({ DATA_PROVIDER: "fake", VERCEL_ENV: "preview" })).toBe("fake");
    expect(readDataProviderName({ DATA_PROVIDER: "fake" })).toBe("fake");
  });

  it("refuses fake in production", () => {
    expect(() => readDataProviderName({ DATA_PROVIDER: "fake", VERCEL_ENV: "production" })).toThrow(
      FakeDataProviderInProductionError,
    );
  });

  it("rejects an unknown provider", () => {
    expect(() => readDataProviderName({ DATA_PROVIDER: "belvo" })).toThrow(
      InvalidDataProviderError,
    );
  });
});

describe("readEncryptionKey / readDocumentHashKey", () => {
  it("returns the configured secrets", () => {
    expect(readEncryptionKey({ ENCRYPTION_KEY: LONG_ENOUGH })).toBe(LONG_ENOUGH);
    expect(readDocumentHashKey({ DOCUMENT_HASH_KEY: LONG_ENOUGH })).toBe(LONG_ENOUGH);
  });

  it("refuses a missing or short secret, naming the variable", () => {
    expect(() => readEncryptionKey({})).toThrow(MissingSecretError);
    expect(() => readDocumentHashKey({ DOCUMENT_HASH_KEY: "short" })).toThrow(MissingSecretError);
    try {
      readEncryptionKey({ ENCRYPTION_KEY: "short" });
    } catch (error) {
      expect((error as MissingSecretError).variable).toBe("ENCRYPTION_KEY");
    }
  });
});
