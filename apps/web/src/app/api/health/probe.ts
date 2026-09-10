import { sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  getExpectedMigrations,
  getMigrationsStatus,
  type MigrationsStatus,
} from "@/db/migrations-status";

const CACHE_TTL_MS = 10_000;

export interface HealthProbe {
  db: boolean;
  migrations: MigrationsStatus;
}

let cachedProbe: { checkedAt: number; result: HealthProbe } | undefined;

async function probeDatabase(): Promise<boolean> {
  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}

async function probeMigrations(): Promise<MigrationsStatus> {
  try {
    const db = getDb();
    return await getMigrationsStatus(db);
  } catch {
    const expected = getExpectedMigrations();
    return { applied: 0, expected: expected.count, upToDate: false };
  }
}

async function probeHealth(): Promise<HealthProbe> {
  const [db, migrations] = await Promise.all([probeDatabase(), probeMigrations()]);
  return { db, migrations };
}

export async function getHealthStatus(): Promise<HealthProbe> {
  const now = Date.now();
  if (cachedProbe && now - cachedProbe.checkedAt < CACHE_TTL_MS) {
    return cachedProbe.result;
  }

  const result = await probeHealth();
  cachedProbe = { checkedAt: now, result };
  return result;
}

export function resetHealthProbeCache(): void {
  cachedProbe = undefined;
}
