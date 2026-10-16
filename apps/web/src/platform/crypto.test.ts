import { describe, expect, it } from "vitest";

import {
  decryptSecret,
  encryptSecret,
  EncryptionKeyMismatchError,
  HOUSEHOLD_AI_KEY_PURPOSE,
  keyIdFor,
  MalformedCiphertextError,
  PROVIDER_CREDENTIALS_PURPOSE,
} from "./crypto";

const KEY = "unit-test-encryption-key-with-at-least-32-chars";
const OTHER_KEY = "another-encryption-key-with-at-least-32-chars!";

describe("encryptSecret / decryptSecret", () => {
  it("round-trips a secret", () => {
    const envelope = encryptSecret(
      '{"clientId":"abc","clientSecret":"s3cret"}',
      KEY,
      PROVIDER_CREDENTIALS_PURPOSE,
    );
    expect(decryptSecret(envelope, KEY, PROVIDER_CREDENTIALS_PURPOSE)).toBe(
      '{"clientId":"abc","clientSecret":"s3cret"}',
    );
  });

  it("never leaves the plaintext in the envelope and uses a fresh iv per call", () => {
    const first = encryptSecret("s3cret", KEY, PROVIDER_CREDENTIALS_PURPOSE);
    const second = encryptSecret("s3cret", KEY, PROVIDER_CREDENTIALS_PURPOSE);
    expect(first).not.toContain("s3cret");
    expect(first).not.toBe(second);
  });

  it("carries the key id in the envelope", () => {
    const envelope = encryptSecret("s3cret", KEY, PROVIDER_CREDENTIALS_PURPOSE);
    expect(envelope.split(":")[2]).toBe(keyIdFor(KEY));
    expect(keyIdFor(KEY)).toHaveLength(8);
    expect(keyIdFor(KEY)).not.toBe(keyIdFor(OTHER_KEY));
  });

  it("refuses to decrypt with a different key, naming the key id it needs", () => {
    const envelope = encryptSecret("s3cret", KEY, PROVIDER_CREDENTIALS_PURPOSE);
    expect(() => decryptSecret(envelope, OTHER_KEY, PROVIDER_CREDENTIALS_PURPOSE)).toThrow(
      EncryptionKeyMismatchError,
    );
    try {
      decryptSecret(envelope, OTHER_KEY, PROVIDER_CREDENTIALS_PURPOSE);
    } catch (error) {
      expect((error as EncryptionKeyMismatchError).ciphertextKeyId).toBe(keyIdFor(KEY));
    }
  });

  it("rejects a tampered ciphertext", () => {
    const envelope = encryptSecret("s3cret", KEY, PROVIDER_CREDENTIALS_PURPOSE);
    const parts = envelope.split(":");
    const last = parts[5] ?? "";
    parts[5] = (last.startsWith("A") ? "B" : "A") + last.slice(1);
    expect(() => decryptSecret(parts.join(":"), KEY, PROVIDER_CREDENTIALS_PURPOSE)).toThrow(
      MalformedCiphertextError,
    );
  });

  it("rejects a truncated authentication tag", () => {
    const parts = encryptSecret("s3cret", KEY, PROVIDER_CREDENTIALS_PURPOSE).split(":");
    parts[4] = (parts[4] ?? "").slice(0, 4);
    expect(() => decryptSecret(parts.join(":"), KEY, PROVIDER_CREDENTIALS_PURPOSE)).toThrow(
      MalformedCiphertextError,
    );
  });

  it("rejects an envelope it did not produce", () => {
    expect(() => decryptSecret("plain-text-secret", KEY, PROVIDER_CREDENTIALS_PURPOSE)).toThrow(
      MalformedCiphertextError,
    );
    expect(() =>
      decryptSecret("enc:v2:abcd1234:iv:tag:ct", KEY, PROVIDER_CREDENTIALS_PURPOSE),
    ).toThrow(MalformedCiphertextError);
  });

  it("still opens a known envelope produced before the purpose parameter existed", () => {
    const envelope =
      "enc:v1:4aa2ba22:BwcHBwcHBwcHBwcH:vQKqJwJk-c-RpBb1AAK5CA:FkMRmpI0q3i6vpjaPXvme6sMCfhcPf2IKY9hkvyVyJxMSspLtOlbgVnG";
    expect(decryptSecret(envelope, KEY, PROVIDER_CREDENTIALS_PURPOSE)).toBe(
      '{"clientId":"abc","clientSecret":"s3cret"}',
    );
  });

  it("never opens a ciphertext encrypted for a different purpose, even with the right key", () => {
    const envelope = encryptSecret("sk-ant-secret", KEY, HOUSEHOLD_AI_KEY_PURPOSE);
    expect(() => decryptSecret(envelope, KEY, PROVIDER_CREDENTIALS_PURPOSE)).toThrow(
      MalformedCiphertextError,
    );
  });
});
