import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("DATABASE_URL is not set; skipping database reset.");
    return;
  }

  const sql = neon(url);
  const tables = await sql`select tablename from pg_tables where schemaname = 'public'`;

  if (tables.length === 0) {
    console.log("No tables to reset.");
    return;
  }

  const tableList = tables.map((row) => `"${row.tablename}"`).join(", ");
  await sql.query(`truncate table ${tableList} restart identity cascade`);
  console.log(`Reset ${tables.length} table(s) in the public schema.`);
}

main().catch((error) => {
  console.error("Database reset failed.");
  console.error(error instanceof Error ? error.message : "Unknown error.");
  process.exit(1);
});
