import { errorName } from "@/lib/error-name";

import type { Database } from "@/platform/db/client";
import { deleteAccessOlderThan } from "./repository";

const RETENTION_MONTHS = 12;

// 12 calendar months back, not a fixed millisecond window (ADR-0008): a
// 31-day month must not survive a day longer than a 28-day one just because
// a fixed window undercounts it. setUTCMonth carries the year on its own
// when the result underflows, so this also walks the year back correctly;
// the one edge case is 29 February rolling forward to 1 March when the
// target year is not a leap year — JS Date's own carry behaviour, which this
// module's test documents rather than works around.
export function retentionCutoff(now: Date): Date {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - RETENTION_MONTHS);
  return cutoff;
}

export type DailyPruneStep = { deleted: number } | { error: string };

export async function runDailyPruneStep(
  db: Database,
  now: Date = new Date(),
): Promise<DailyPruneStep> {
  try {
    const deleted = await deleteAccessOlderThan(db, retentionCutoff(now));
    return { deleted };
  } catch (error) {
    return { error: errorName(error) };
  }
}
