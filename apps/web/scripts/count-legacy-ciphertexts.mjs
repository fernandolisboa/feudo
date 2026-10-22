import { Pool } from "@neondatabase/serverless";

import { LEGACY_ENVELOPE_PATTERN } from "../src/platform/crypto.ts";
import { assertDatabaseConnectionAllowed } from "../src/platform/db/connection-guard.ts";
import { DatabaseConnectionNotAllowedError } from "../src/platform/db/errors.ts";

// Read-only proof for issue #152: the pre-binding envelope (enc:v1) may only
// stop being decrypted once no stored secret still uses it. Prints counts,
// never ids or ciphertext.
const COUNTS = [
  {
    label: "provider_credential",
    query: "select count(*)::int as n from provider_credential where ciphertext like $1",
  },
  {
    label: "household_ai_settings",
    query: "select count(*)::int as n from household_ai_settings where api_key_ciphertext like $1",
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set; refusing to count.");
    process.exit(1);
  }
  assertDatabaseConnectionAllowed(process.env, { allowProduction: true });

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query("begin transaction read only");
    for (const { label, query } of COUNTS) {
      const { rows } = await client.query(query, [LEGACY_ENVELOPE_PATTERN]);
      console.log(`${label} enc:v1 rows: ${String(rows[0].n)}`);
    }
    await client.query("rollback");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Counting legacy ciphertexts failed.");
  if (error instanceof DatabaseConnectionNotAllowedError) {
    console.error(error.message);
  } else {
    console.error(error?.name ?? "Error");
    if (error?.code) {
      console.error(error.code);
    }
  }
  process.exit(1);
});
