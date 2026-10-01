import { errorName } from "@/lib/error-name";

import type { Database } from "@/platform/db/client";
import { CONSENT_MAX_AGE_MS } from "./consent-text";
import {
  pruneOldAuthAttempts,
  pruneOldManualSyncTriggers,
  pruneOrphanConsents,
} from "./repository";
import { AUTH_ATTEMPT_WINDOW_MS } from "./service";

// Past every household's own calendar day, whatever its time zone.
const MANUAL_SYNC_TRIGGER_RETENTION_MS = 48 * 60 * 60 * 1000;

export type DailyPruneStep = { deleted: number } | { error: string };

export async function runDailyPruneStep(db: Database): Promise<DailyPruneStep> {
  try {
    const now = Date.now();
    const deleted =
      (await pruneOrphanConsents(db, new Date(now - CONSENT_MAX_AGE_MS))) +
      (await pruneOldAuthAttempts(db, new Date(now - AUTH_ATTEMPT_WINDOW_MS))) +
      (await pruneOldManualSyncTriggers(db, new Date(now - MANUAL_SYNC_TRIGGER_RETENTION_MS)));
    return { deleted };
  } catch (error) {
    return { error: errorName(error) };
  }
}
