import { createCipheriv, hkdfSync, randomBytes } from "node:crypto";

import { keyIdFor } from "../crypto";

// What encryptSecret wrote before envelopes were bound to their owner (v1),
// frozen as it was: tests use it to seed rows that predate the binding.
export function encryptLegacySecret(
  plaintext: string,
  encryptionKey: string,
  purpose: string,
): string {
  const iv = randomBytes(12);
  const key = Buffer.from(hkdfSync("sha256", encryptionKey, "", purpose, 32));
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [
    "enc",
    "v1",
    keyIdFor(encryptionKey),
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}
