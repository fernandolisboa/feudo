import { describe, expect, it } from "vitest";

import {
  hasValidEncryptionKey,
  MissingEncryptionKeyError,
  readEncryptionKey,
} from "./encryption-key";

const LONG_ENOUGH = "x".repeat(32);

describe("readEncryptionKey", () => {
  it("returns the configured key", () => {
    expect(readEncryptionKey({ ENCRYPTION_KEY: LONG_ENOUGH })).toBe(LONG_ENOUGH);
  });

  it("throws when missing, blank or too short", () => {
    expect(() => readEncryptionKey({})).toThrow(MissingEncryptionKeyError);
    expect(() => readEncryptionKey({ ENCRYPTION_KEY: "  " })).toThrow(MissingEncryptionKeyError);
    expect(() => readEncryptionKey({ ENCRYPTION_KEY: "short" })).toThrow(MissingEncryptionKeyError);
  });
});

describe("hasValidEncryptionKey", () => {
  it("is true only for a key that readEncryptionKey would accept", () => {
    expect(hasValidEncryptionKey({ ENCRYPTION_KEY: LONG_ENOUGH })).toBe(true);
    expect(hasValidEncryptionKey({})).toBe(false);
    expect(hasValidEncryptionKey({ ENCRYPTION_KEY: "short" })).toBe(false);
  });
});
