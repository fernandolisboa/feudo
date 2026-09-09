import { sql } from "drizzle-orm";

import { assertDatabaseResetAllowed, type ResetGuardEnv } from "./reset-guard.ts";

import type { Database } from "./client.ts";

const DRIZZLE_MIGRATIONS_SCHEMA = "drizzle";

export async function resetSchemas(db: Database, env: ResetGuardEnv = process.env): Promise<void> {
  assertDatabaseResetAllowed(env);

  await db.execute(sql.raw(`drop schema if exists "${DRIZZLE_MIGRATIONS_SCHEMA}" cascade`));
  await db.execute(sql.raw(`drop schema if exists "public" cascade`));
  await db.execute(sql.raw(`create schema "public"`));
  await db.execute(sql.raw(`grant usage, create on schema public to public`));
}
