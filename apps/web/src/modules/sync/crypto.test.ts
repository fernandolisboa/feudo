import { describe, expect, it } from "vitest";

import {
  decryptSecret,
  encryptSecret,
  EncryptionKeyMismatchError,
  keyIdFor,
  MalformedCiphertextError,
} from "./crypto";

const KEY = "unit-test-encryption-key-with-at-least-32-chars";
const OTHER_KEY = "another-encryption-key-with-at-least-32-chars!";

describe("encryptSecret / decryptSecret", () => {
  it("round-trips a secret", () => {
    const envelope = encryptSecret('{"clientId":"abc","clientSecret":"s3cret"}', KEY);
    expect(decryptSecret(envelope, KEY)).toBe('{"clientId":"abc","clientSecret":"s3cret"}');
  });

  it("never leaves the plaintext in the envelope and uses a fresh iv per call", () => {
    const first = encryptSecret("s3cret", KEY);
    const second = encryptSecret("s3cret", KEY);
    expect(first).not.toContain("s3cret");
    expect(first).not.toBe(second);
  });

  it("carries the key id in the envelope", () => {
    const envelope = encryptSecret("s3cret", KEY);
    expect(envelope.split(":")[2]).toBe(keyIdFor(KEY));
    expect(keyIdFor(KEY)).toHaveLength(8);
    expect(keyIdFor(KEY)).not.toBe(keyIdFor(OTHER_KEY));
  });

  it("refuses to decrypt with a different key, naming the key id it needs", () => {
    const envelope = encryptSecret("s3cret", KEY);
    expect(() => decryptSecret(envelope, OTHER_KEY)).toThrow(EncryptionKeyMismatchError);
    try {
      decryptSecret(envelope, OTHER_KEY);
    } catch (error) {
      expect((error as EncryptionKeyMismatchError).ciphertextKeyId).toBe(keyIdFor(KEY));
    }
  });

  it("rejects a tampered ciphertext", () => {
    const envelope = encryptSecret("s3cret", KEY);
    const parts = envelope.split(":");
    const last = parts[5] ?? "";
    parts[5] = (last.startsWith("A") ? "B" : "A") + last.slice(1);
    expect(() => decryptSecret(parts.join(":"), KEY)).toThrow(MalformedCiphertextError);
  });

  it("rejects a truncated authentication tag", () => {
    const parts = encryptSecret("s3cret", KEY).split(":");
    parts[4] = (parts[4] ?? "").slice(0, 4);
    expect(() => decryptSecret(parts.join(":"), KEY)).toThrow(MalformedCiphertextError);
  });

  it("rejects an envelope it did not produce", () => {
    expect(() => decryptSecret("plain-text-secret", KEY)).toThrow(MalformedCiphertextError);
    expect(() => decryptSecret("enc:v2:abcd1234:iv:tag:ct", KEY)).toThrow(MalformedCiphertextError);
  });
});
