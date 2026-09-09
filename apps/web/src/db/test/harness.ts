import { sql } from "drizzle-orm";

import { getDb, type Database } from "../client";

async function truncateAllTables(db: Database): Promise<void> {
  const { rows } = await db.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public'`,
  );

  if (rows.length === 0) {
    return;
  }

  const tableList = rows.map((row) => `"${row.tablename}"`).join(", ");
  await db.execute(sql.raw(`truncate table ${tableList} restart identity cascade`));
}

export async function withTestDb(run: (db: Database) => Promise<void>): Promise<void> {
  const db = getDb();
  await truncateAllTables(db);
  await run(db);
}
