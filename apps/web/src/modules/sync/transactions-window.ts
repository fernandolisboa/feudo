export const FIRST_SYNC_MONTHS = 12;
export const RESYNC_OVERLAP_DAYS = 7;

function isoDateOnly(instant: Date): string {
  return instant.toISOString().slice(0, 10);
}

// The first sync starts at the first day of the month twelve months back, so
// the ledger holds at least twelve complete months (ADR-0003 averages fixed
// cost over six of them). Later syncs re-read a week before the last one:
// banks post transactions late and revise them, and the unique index on
// (account, provider transaction) turns the overlap into an update.
export function transactionsSince(now: Date, lastSyncedAt: Date | null): string {
  if (lastSyncedAt === null) {
    return isoDateOnly(
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - FIRST_SYNC_MONTHS, 1)),
    );
  }
  return isoDateOnly(new Date(lastSyncedAt.getTime() - RESYNC_OVERLAP_DAYS * 24 * 60 * 60 * 1000));
}

// A first sync that kept failing on the twelve-month window (a listing too
// long to page through, or one that never finished before the run's
// deadline) asks for one narrow month instead: enough to make progress and
// clear the error, trading older history for finishing at all (ADR-0005). A
// successful sync clears the error and the incremental window applies from
// then on.
export function narrowedFirstSyncSince(now: Date): string {
  return isoDateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)));
}
