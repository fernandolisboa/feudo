import { getDb } from "../src/db/client.ts";
import { DatabaseResetNotAllowedError } from "../src/db/errors.ts";
import { resetSchemas } from "../src/db/schema-reset.ts";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (process.env.CI) {
      console.error("DATABASE_URL is not set; refusing to continue under CI.");
      process.exit(1);
    }
    console.log("DATABASE_URL is not set; skipping schema reset.");
    return;
  }

  const db = getDb();
  try {
    await resetSchemas(db);
    console.log('Dropped and recreated the "public" schema and dropped the "drizzle" schema.');
  } finally {
    await db.$client.end();
  }
}

main().catch((error) => {
  console.error("Schema reset failed.");
  if (error instanceof DatabaseResetNotAllowedError) {
    console.error(error.message);
  } else {
    console.error(error?.name ?? "Error");
    if (error?.code) {
      console.error(error.code);
    }
  }
  process.exit(1);
});
