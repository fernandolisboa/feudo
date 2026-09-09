import { drizzle } from "drizzle-orm/neon-serverless";

import { MissingDatabaseUrlError } from "./errors.ts";
import * as schema from "./schema/index.ts";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

let cachedDb: Database | undefined;

export function getDb(): Database {
  if (cachedDb) {
    return cachedDb;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new MissingDatabaseUrlError();
  }

  cachedDb = drizzle({ connection: url, schema });
  return cachedDb;
}
