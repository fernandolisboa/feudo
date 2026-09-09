import { timingSafeEqual } from "node:crypto";

// Constant-time compare: guards bearer-token endpoints against timing attacks on the secret.
export function tokensMatch(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
