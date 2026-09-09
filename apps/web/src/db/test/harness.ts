import { getDb, type Database } from "../client";
import { resetDatabase } from "../reset";

export async function withTestDb(run: (db: Database) => Promise<void>): Promise<void> {
  const db = getDb();
  await resetDatabase(db);
  await run(db);
}
