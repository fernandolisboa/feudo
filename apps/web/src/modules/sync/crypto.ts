import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from "node:crypto";

const ENVELOPE_PREFIX = "enc";
const ENVELOPE_VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const KEY_BYTES = 32;
const HKDF_INFO = "feudo:provider-credentials";
const KEY_ID_PREFIX = "feudo:key-id:";
const KEY_ID_LENGTH = 8;

export class EncryptionKeyMismatchError extends Error {
  readonly ciphertextKeyId: string;

  constructor(ciphertextKeyId: string) {
    super(`Ciphertext was produced with key ${ciphertextKeyId}, which is not the current key.`);
    this.name = "EncryptionKeyMismatchError";
    this.ciphertextKeyId = ciphertextKeyId;
  }
}

export class MalformedCiphertextError extends Error {
  constructor() {
    super("Ciphertext does not match the expected envelope.");
    this.name = "MalformedCiphertextError";
  }
}

// The key id is derived from the key, not stored beside it: two deployments
// with the same ENCRYPTION_KEY agree on the id, and a rotated key produces a
// different one, so a row's envelope says which key can open it.
export function keyIdFor(encryptionKey: string): string {
  return createHash("sha256")
    .update(KEY_ID_PREFIX + encryptionKey)
    .digest("hex")
    .slice(0, KEY_ID_LENGTH);
}

function deriveAesKey(encryptionKey: string): Buffer {
  return Buffer.from(hkdfSync("sha256", encryptionKey, "", HKDF_INFO, KEY_BYTES));
}

export function encryptSecret(plaintext: string, encryptionKey: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, deriveAesKey(encryptionKey), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    ENVELOPE_PREFIX,
    ENVELOPE_VERSION,
    keyIdFor(encryptionKey),
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

export function decryptSecret(envelope: string, encryptionKey: string): string {
  const parts = envelope.split(":");
  if (parts.length !== 6 || parts[0] !== ENVELOPE_PREFIX || parts[1] !== ENVELOPE_VERSION) {
    throw new MalformedCiphertextError();
  }
  const [, , keyId, ivEncoded, tagEncoded, ciphertextEncoded] = parts;
  if (
    keyId === undefined ||
    ivEncoded === undefined ||
    tagEncoded === undefined ||
    ciphertextEncoded === undefined
  ) {
    throw new MalformedCiphertextError();
  }
  if (keyId !== keyIdFor(encryptionKey)) {
    throw new EncryptionKeyMismatchError(keyId);
  }
  try {
    const decipher = createDecipheriv(
      ALGORITHM,
      deriveAesKey(encryptionKey),
      Buffer.from(ivEncoded, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextEncoded, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new MalformedCiphertextError();
  }
}
