import { sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  getMigrationsStatus,
  unknownMigrationsStatus,
  type MigrationsStatus,
} from "@/db/migrations-status";

const CACHE_TTL_MS = 10_000;

interface HealthProbe {
  db: boolean;
  migrations: { status: MigrationsStatus };
}

let cachedProbe: { checkedAt: number; result: HealthProbe } | undefined;
let inFlightProbe: Promise<HealthProbe> | undefined;

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
    return unknownMigrationsStatus();
  }
}

async function probeHealth(): Promise<HealthProbe> {
  const [db, status] = await Promise.all([probeDatabase(), probeMigrations()]);
  return { db, migrations: { status } };
}

export async function getHealthStatus(): Promise<HealthProbe> {
  const now = Date.now();
  if (cachedProbe && now - cachedProbe.checkedAt < CACHE_TTL_MS) {
    return cachedProbe.result;
  }

  if (!inFlightProbe) {
    inFlightProbe = probeHealth()
      .then((result) => {
        cachedProbe = { checkedAt: Date.now(), result };
        return result;
      })
      .finally(() => {
        inFlightProbe = undefined;
      });
  }

  return inFlightProbe;
}

export function resetHealthProbeCache(): void {
  cachedProbe = undefined;
  inFlightProbe = undefined;
}
