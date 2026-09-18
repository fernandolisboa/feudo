import { tokensMatch } from "./timing-safe-token";

export function isCronRequestAuthorized(authorizationHeader: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authorizationHeader) {
    return false;
  }
  return tokensMatch(`Bearer ${cronSecret}`, authorizationHeader);
}
