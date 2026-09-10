import { lt } from "drizzle-orm";

import { verification } from "@/db/schema/auth";

import type { Database } from "@/db/client";

export async function pruneExpiredVerifications(db: Database): Promise<number> {
  const result = await db.delete(verification).where(lt(verification.expiresAt, new Date()));
  return result.rowCount ?? 0;
}
