export type ConnectionSyncFailure =
  | "no_credentials"
  | "credentials_unreadable"
  | "invalid_credentials"
  | "provider_unavailable"
  | "listing_too_long"
  | "timed_out"
  | "too_slow"
  | "failed";

// A first sync that failed one of these ways left no data at all and would
// hit the same wall again on the usual twelve-month window, so the
// connection's own `first_sync_since` is set to a narrowed window (#84).
// `timed_out` is deliberately excluded: it means this connection simply
// landed late in the run's queue, not that its own listing is too big, so
// narrowing it would not help and would cost history for no reason.
export const NARROWING_FAILURES = [
  "listing_too_long",
  "too_slow",
] as const satisfies readonly ConnectionSyncFailure[];

export function isNarrowingFailure(error: string): boolean {
  return (NARROWING_FAILURES as readonly string[]).includes(error);
}
