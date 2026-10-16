import { errorName } from "@/lib/error-name";

import type { Database } from "@/platform/db/client";
import { deleteAttemptsOlderThan, USER_WINDOW_MS } from "./key-verification-attempts";

export type DailyPruneStep = { deleted: number } | { error: string };

// Cross-household sweep for ai_key_verification_attempt (ADR-0008): reserve()
// already drops a household's own rows past this same cutoff whenever that
// household attempts again, but a household that attempts once and never
// again would otherwise keep its rows indefinitely. This is a step of the
// existing `GET /api/cron/daily`, not a cron of its own.
export async function runDailyPruneStep(
  db: Database,
  now: Date = new Date(),
): Promise<DailyPruneStep> {
  try {
    const deleted = await deleteAttemptsOlderThan(db, new Date(now.getTime() - USER_WINDOW_MS));
    return { deleted };
  } catch (error) {
    return { error: errorName(error) };
  }
}
