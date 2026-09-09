import { sql } from "drizzle-orm";

import { getDb } from "@/db/client";

const CACHE_TTL_MS = 10_000;

let cachedProbe: { checkedAt: number; ok: boolean } | undefined;

async function probeDatabase(): Promise<boolean> {
  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}

export async function getDbStatus(): Promise<boolean> {
  const now = Date.now();
  if (cachedProbe && now - cachedProbe.checkedAt < CACHE_TTL_MS) {
    return cachedProbe.ok;
  }

  const ok = await probeDatabase();
  cachedProbe = { checkedAt: now, ok };
  return ok;
}

export function resetHealthProbeCache(): void {
  cachedProbe = undefined;
}
