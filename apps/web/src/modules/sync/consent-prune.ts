import { errorName } from "@/lib/error-name";

import type { Database } from "@/platform/db/client";
import { CONSENT_MAX_AGE_MS } from "./consent-text";
import { pruneOrphanConsents } from "./repository";

export type DailyPruneStep = { deleted: number } | { error: string };

export async function runDailyPruneStep(db: Database): Promise<DailyPruneStep> {
  try {
    const deleted = await pruneOrphanConsents(db, new Date(Date.now() - CONSENT_MAX_AGE_MS));
    return { deleted };
  } catch (error) {
    return { error: errorName(error) };
  }
}
