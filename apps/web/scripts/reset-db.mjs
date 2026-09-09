import { getDb } from "../src/db/client.ts";
import { DatabaseResetNotAllowedError } from "../src/db/errors.ts";
import { resetDatabase } from "../src/db/reset.ts";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (process.env.CI) {
      console.error("DATABASE_URL is not set; refusing to continue under CI.");
      process.exit(1);
    }
    console.log("DATABASE_URL is not set; skipping database reset.");
    return;
  }

  const db = getDb();
  try {
    const tableCount = await resetDatabase(db);
    console.log(`Reset ${tableCount} table(s) in the public schema.`);
  } finally {
    await db.$client.end();
  }
}

main().catch((error) => {
  console.error("Database reset failed.");
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
