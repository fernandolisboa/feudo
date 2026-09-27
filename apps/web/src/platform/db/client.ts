import { drizzle } from "drizzle-orm/neon-serverless";

import { assertDatabaseConnectionAllowed } from "./connection-guard.ts";
import { MissingDatabaseUrlError } from "./errors.ts";
import { attachPoolErrorLogger } from "./pool-error-logger.ts";
import * as schema from "./schema.ts";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

// A repository method that must run inside a caller-managed transaction (to
// group several writes into one commit) accepts this wider type instead of
// Database alone: db.transaction's tx handle is a structurally different TS
// type than the pooled connection.
export type DatabaseOrTransaction =
  Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

let cachedDb: Database | undefined;

export function getDb(): Database {
  if (cachedDb) {
    return cachedDb;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new MissingDatabaseUrlError();
  }
  assertDatabaseConnectionAllowed(process.env, {
    allowProduction:
      process.env.VERCEL_ENV === "production" && process.env.NODE_ENV === "production",
  });

  cachedDb = drizzle({ connection: url, schema });
  attachPoolErrorLogger(cachedDb.$client);
  return cachedDb;
}
