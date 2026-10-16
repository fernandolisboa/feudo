import { describe, expect, it } from "vitest";

import { keyIdFor } from "./crypto";
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

  it("throws when missing, empty or too short", () => {
    expect(() => readEncryptionKey({})).toThrow(MissingEncryptionKeyError);
    expect(() => readEncryptionKey({ ENCRYPTION_KEY: "" })).toThrow(MissingEncryptionKeyError);
    expect(() => readEncryptionKey({ ENCRYPTION_KEY: "  " })).toThrow(MissingEncryptionKeyError);
    expect(() => readEncryptionKey({ ENCRYPTION_KEY: "short" })).toThrow(MissingEncryptionKeyError);
  });

  it("checks the raw length, not the trimmed one, same as sync's rule before this moved here", () => {
    const paddedToThirtyTwo = ` ${"x".repeat(30)} `;
    expect(paddedToThirtyTwo).toHaveLength(32);
    expect(paddedToThirtyTwo.trim()).toHaveLength(30);

    expect(readEncryptionKey({ ENCRYPTION_KEY: paddedToThirtyTwo })).toBe(paddedToThirtyTwo);
  });

  it("never trims the value it returns, so keyIdFor (and the derived AES key) never changes for a key that worked yesterday", () => {
    const withSurroundingWhitespace = ` ${LONG_ENOUGH} `;

    const returned = readEncryptionKey({ ENCRYPTION_KEY: withSurroundingWhitespace });

    expect(returned).toBe(withSurroundingWhitespace);
    expect(keyIdFor(returned)).toBe(keyIdFor(withSurroundingWhitespace));
    expect(keyIdFor(returned)).not.toBe(keyIdFor(withSurroundingWhitespace.trim()));
  });
});

describe("hasValidEncryptionKey", () => {
  it("is true only for a key that readEncryptionKey would accept", () => {
    expect(hasValidEncryptionKey({ ENCRYPTION_KEY: LONG_ENOUGH })).toBe(true);
    expect(hasValidEncryptionKey({})).toBe(false);
    expect(hasValidEncryptionKey({ ENCRYPTION_KEY: "short" })).toBe(false);
  });
});
