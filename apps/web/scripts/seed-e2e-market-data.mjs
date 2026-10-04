import { marketData } from "../src/modules/market-data/schema.ts";
import { getDb } from "../src/platform/db/client.ts";
import {
  DatabaseConnectionNotAllowedError,
  DatabaseResetNotAllowedError,
} from "../src/platform/db/errors.ts";
import { assertDatabaseResetAllowed } from "../src/platform/db/reset-guard.ts";

// Fixed Central Bank indicators for the e2e run, so the Reserva ranking
// computes the same yields on every run. The preview schema starts empty and
// nothing there fetches SGS (Vercel Cron runs only in production). Series
// codes are Bacen's own: 12 daily CDI, 11 daily Selic, 432 Selic target,
// 433 monthly IPCA, 13522 IPCA over 12 months.
const OBSERVATIONS = [
  { seriesCode: "12", referenceDate: "2026-09-30", value: "0.050000" },
  { seriesCode: "11", referenceDate: "2026-09-30", value: "0.050000" },
  { seriesCode: "432", referenceDate: "2026-09-30", value: "15.00" },
  { seriesCode: "433", referenceDate: "2026-08-01", value: "0.40" },
  { seriesCode: "13522", referenceDate: "2026-08-01", value: "5.00" },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set; refusing to seed.");
    process.exit(1);
  }
  // Made-up rates must never reach a database that holds real readings: only
  // one that is allowed to be reset (the preview project) can be seeded.
  assertDatabaseResetAllowed(process.env);

  const db = getDb();
  try {
    await db.insert(marketData).values(OBSERVATIONS).onConflictDoNothing();
    console.log(`Seeded ${String(OBSERVATIONS.length)} market indicators for e2e.`);
  } finally {
    await db.$client.end();
  }
}

main().catch((error) => {
  console.error("Seeding e2e market indicators failed.");
  if (
    error instanceof DatabaseResetNotAllowedError ||
    error instanceof DatabaseConnectionNotAllowedError
  ) {
    console.error(error.message);
  } else {
    console.error(error?.name ?? "Error");
    if (error?.code) {
      console.error(error.code);
    }
  }
  process.exit(1);
});
