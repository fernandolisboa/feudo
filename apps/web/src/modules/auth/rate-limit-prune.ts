import { lt } from "drizzle-orm";

import { rateLimit } from "./schema";

import { errorName } from "@/lib/error-name";

import type { Database } from "@/platform/db/client";

const RETENTION_MS = 86_400_000;

// The key embeds the requester's IP, and Better Auth only prunes the table
// when later traffic opens a new window, so a quiet address would stay
// indefinitely. This bounds its retention at one day; the longest window
// configured in options.ts is 60s, far under it.
export async function pruneStaleRateLimits(db: Database, now: Date): Promise<number> {
  const result = await db
    .delete(rateLimit)
    .where(lt(rateLimit.lastRequest, now.getTime() - RETENTION_MS));
  return result.rowCount ?? 0;
}

export type RateLimitPruneStep = { deleted: number } | { error: string };

export async function runRateLimitPruneStep(db: Database, now: Date): Promise<RateLimitPruneStep> {
  try {
    const deleted = await pruneStaleRateLimits(db, now);
    return { deleted };
  } catch (error) {
    return { error: errorName(error) };
  }
}
