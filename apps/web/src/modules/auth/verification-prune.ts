import { lt } from "drizzle-orm";

import { verification } from "./schema";

import { errorName } from "@/lib/error-name";

import type { Database } from "@/platform/db/client";

export async function pruneExpiredVerifications(db: Database): Promise<number> {
  const result = await db.delete(verification).where(lt(verification.expiresAt, new Date()));
  return result.rowCount ?? 0;
}

export type DailyPruneStep = { deleted: number } | { error: string };

export async function runDailyPruneStep(db: Database): Promise<DailyPruneStep> {
  try {
    const deleted = await pruneExpiredVerifications(db);
    return { deleted };
  } catch (error) {
    return { error: errorName(error) };
  }
}
