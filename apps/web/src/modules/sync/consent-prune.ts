import { errorName } from "@/lib/error-name";

import type { Database } from "@/platform/db/client";
import { CONSENT_MAX_AGE_MS } from "./consent-text";
import { pruneOldAuthAttempts, pruneOrphanConsents } from "./repository";
import { AUTH_ATTEMPT_WINDOW_MS } from "./service";

export type DailyPruneStep = { deleted: number } | { error: string };

export async function runDailyPruneStep(db: Database): Promise<DailyPruneStep> {
  try {
    const now = Date.now();
    const deleted =
      (await pruneOrphanConsents(db, new Date(now - CONSENT_MAX_AGE_MS))) +
      (await pruneOldAuthAttempts(db, new Date(now - AUTH_ATTEMPT_WINDOW_MS)));
    return { deleted };
  } catch (error) {
    return { error: errorName(error) };
  }
}
