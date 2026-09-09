import { timingSafeEqual } from "node:crypto";

export function isCronRequestAuthorized(authorizationHeader: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authorizationHeader) {
    return false;
  }
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const received = Buffer.from(authorizationHeader);
  // Constant-time compare: guards the cron endpoint against timing attacks on the secret.
  return expected.length === received.length && timingSafeEqual(expected, received);
}
