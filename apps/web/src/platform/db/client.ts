import { drizzle } from "drizzle-orm/neon-serverless";

import { assertDatabaseConnectionAllowed } from "./connection-guard.ts";
import { MissingDatabaseUrlError } from "./errors.ts";
import { attachPoolErrorLogger } from "./pool-error-logger.ts";
import * as schema from "./schema.ts";

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
  assertDatabaseConnectionAllowed(process.env);

  cachedDb = drizzle({ connection: url, schema });
  attachPoolErrorLogger(cachedDb.$client);
  return cachedDb;
}
