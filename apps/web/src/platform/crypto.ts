import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from "node:crypto";

const ENVELOPE_PREFIX = "enc";
// v2 binds each ciphertext to the row it belongs to (GCM additional
// authenticated data). The unbound v1 envelope is refused (#152).
const ENVELOPE_VERSION = "v2";
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
// Pinned on both sides: without it Node accepts a tag cut down to 4 bytes,
// which a forger can brute-force.
const AUTH_TAG_BYTES = 16;
const KEY_BYTES = 32;
const KEY_ID_PREFIX = "feudo:key-id:";
const KEY_ID_LENGTH = 8;

// Every caller names its own purpose (HKDF's `info`), so the same
// ENCRYPTION_KEY derives a different AES key per use: a ciphertext meant for
// one purpose fails to decrypt (an auth-tag mismatch, read as
// MalformedCiphertextError) if read back under another, even with the right
// key and no tampering. Defined here, not at each call site, so every
// purpose in use is visible in one place and two slices can never collide by
// picking the same label without meaning to.
export const PROVIDER_CREDENTIALS_PURPOSE = "feudo:provider-credentials";
export const HOUSEHOLD_AI_KEY_PURPOSE = "feudo:household-ai-key";

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

function deriveAesKey(encryptionKey: string, purpose: string): Buffer {
  return Buffer.from(hkdfSync("sha256", encryptionKey, "", purpose, KEY_BYTES));
}

// `boundTo` names the row's owner (the user id or the household id): a
// ciphertext copied into another owner's row fails to decrypt there.
export function encryptSecret(
  plaintext: string,
  encryptionKey: string,
  purpose: string,
  boundTo: string,
): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, deriveAesKey(encryptionKey, purpose), iv, {
    authTagLength: AUTH_TAG_BYTES,
  });
  cipher.setAAD(Buffer.from(boundTo, "utf8"));
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

export function decryptSecret(
  envelope: string,
  encryptionKey: string,
  purpose: string,
  boundTo: string,
): string {
  const parts = envelope.split(":");
  const version = parts[1];
  if (parts.length !== 6 || parts[0] !== ENVELOPE_PREFIX || version !== ENVELOPE_VERSION) {
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
      deriveAesKey(encryptionKey, purpose),
      Buffer.from(ivEncoded, "base64url"),
      { authTagLength: AUTH_TAG_BYTES },
    );
    decipher.setAAD(Buffer.from(boundTo, "utf8"));
    decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextEncoded, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new MalformedCiphertextError();
  }
}
