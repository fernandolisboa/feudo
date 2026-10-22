import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const DIGEST_KEY = randomBytes(32);

function digest(value: string): Buffer {
  return createHmac("sha256", DIGEST_KEY).update(value).digest();
}

// Constant-time compare: guards bearer-token endpoints against timing attacks
// on the secret. Both sides are reduced to fixed-length HMACs first, so a
// mismatched length takes the same path and leaks neither content nor length.
export function tokensMatch(expected: string, received: string): boolean {
  return timingSafeEqual(digest(expected), digest(received));
}
