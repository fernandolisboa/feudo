import { sql } from "drizzle-orm";

import { assertDatabaseResetAllowed, type ResetGuardEnv } from "./reset-guard.ts";

import type { Database } from "./client.ts";

type TableNameRow = { tablename: string };

function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

export async function resetDatabase(
  db: Database,
  env: ResetGuardEnv = process.env,
): Promise<number> {
  assertDatabaseResetAllowed(env);

  const { rows } = await db.execute<TableNameRow>(
    sql`select tablename from pg_tables where schemaname = 'public'`,
  );

  if (rows.length === 0) {
    return 0;
  }

  const tableList = rows.map((row) => quoteIdentifier(row.tablename)).join(", ");
  await db.execute(sql.raw(`truncate table ${tableList} restart identity cascade`));
  return rows.length;
}
