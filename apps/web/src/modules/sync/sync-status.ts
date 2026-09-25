export type ConnectionSyncFailure =
  | "no_credentials"
  | "credentials_unreadable"
  | "invalid_credentials"
  | "provider_unavailable"
  | "listing_too_long"
  | "timed_out"
  | "too_slow"
  | "failed";

// Failures that mean this connection's own listing is the likely reason, not
// the run's clock or its place in the queue, so a first sync's window
// narrows the moment one of these happens (#84).
export const NARROWING_FAILURES = [
  "listing_too_long",
  "too_slow",
] as const satisfies readonly ConnectionSyncFailure[];

export function isNarrowingFailure(status: ConnectionSyncFailure): boolean {
  return (NARROWING_FAILURES as readonly ConnectionSyncFailure[]).includes(status);
}

// Failures caused by the run's own clock rather than this connection: on
// their own they say nothing about its size. Two in a row — this run and the
// one before it — mean this connection keeps losing its slice to something
// else in the queue, which narrowing is the fallback for.
const DEADLINE_ABORT_FAILURES = [
  "too_slow",
  "timed_out",
] as const satisfies readonly ConnectionSyncFailure[];

function isDeadlineAbort(error: string | null): boolean {
  return error !== null && (DEADLINE_ABORT_FAILURES as readonly string[]).includes(error);
}

// Whether a first sync (no history yet) that just ended with `status` should
// narrow its window to the previous month. `listing_too_long` and `too_slow`
// always do; a lone `timed_out` does not, since it only says this connection
// landed late in the queue once — but a `timed_out` whose own previous
// attempt (read from the row before this run overwrites it) was itself
// `too_slow` or `timed_out` means two consecutive deadline aborts, and
// narrowing is what lets it make progress at all.
export function shouldNarrowFirstSync(
  status: ConnectionSyncFailure,
  previousError: string | null,
): boolean {
  if (isNarrowingFailure(status)) {
    return true;
  }
  return status === "timed_out" && isDeadlineAbort(previousError);
}
