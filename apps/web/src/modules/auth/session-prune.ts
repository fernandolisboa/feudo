import { lt } from "drizzle-orm";

import { session } from "./schema";

import { errorName } from "@/lib/error-name";

import type { Database } from "@/platform/db/client";

// LGPD data minimization: an expired session is useless but still carries the
// sign-in's ip_address and user_agent.
export async function pruneExpiredSessions(db: Database, now: Date): Promise<number> {
  const result = await db.delete(session).where(lt(session.expiresAt, now));
  return result.rowCount ?? 0;
}

export type SessionPruneStep = { deleted: number } | { error: string };

export async function runSessionPruneStep(db: Database, now: Date): Promise<SessionPruneStep> {
  try {
    const deleted = await pruneExpiredSessions(db, now);
    return { deleted };
  } catch (error) {
    return { error: errorName(error) };
  }
}
