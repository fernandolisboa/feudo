import { errorName } from "@/lib/error-name";

import type { Database } from "@/platform/db/client";
import { deleteUnverifiedSignUpsCreatedBefore } from "./repository";

const UNVERIFIED_SIGN_UP_RETENTION_DAYS = 7;

const DAY_MS = 86_400_000;

export type UnverifiedSignUpPruneStep = { deleted: number } | { error: string };

// LGPD data minimization: a sign-up that never confirmed its email holds a
// name and an address for nothing.
export async function runUnverifiedSignUpPruneStep(
  db: Database,
  now: Date,
): Promise<UnverifiedSignUpPruneStep> {
  try {
    const cutoff = new Date(now.getTime() - UNVERIFIED_SIGN_UP_RETENTION_DAYS * DAY_MS);
    const deleted = await deleteUnverifiedSignUpsCreatedBefore(db, cutoff);
    return { deleted };
  } catch (error) {
    return { error: errorName(error) };
  }
}
