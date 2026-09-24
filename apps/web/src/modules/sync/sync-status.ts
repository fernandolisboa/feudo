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
// hit the same wall again on the usual twelve-month window, so the next
// attempt narrows it instead (#84). `timed_out` is deliberately excluded:
// it means this connection simply landed late in the run's queue, not that
// its own listing is too big, so narrowing it would not help and would cost
// history for no reason.
export const NARROWING_FAILURES = [
  "listing_too_long",
  "too_slow",
] as const satisfies readonly ConnectionSyncFailure[];

// A run's own time or volume, not something about the connection itself: the
// daily job's window-narrowing (NARROWING_FAILURES above) is the fix for
// these, not the back of tomorrow's queue. Kept in step with
// ConnectionSyncFailure here so repository.ts's ordering and service.ts's
// classification cannot drift apart under a rename.
export const VOLUME_OR_TIME_FAILURES = [
  "timed_out",
  "too_slow",
  "listing_too_long",
] as const satisfies readonly ConnectionSyncFailure[];

export function shouldNarrowFirstSync(error: string | null): boolean {
  return error !== null && (NARROWING_FAILURES as readonly string[]).includes(error);
}
