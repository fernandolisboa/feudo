import { defineConfig } from "drizzle-kit";

import { assertDatabaseConnectionAllowed } from "./src/platform/db/connection-guard.ts";

const PLACEHOLDER_URL = "postgres://placeholder:placeholder@localhost:5432/placeholder";

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return PLACEHOLDER_URL;
  }
  assertDatabaseConnectionAllowed(process.env, {
    allowProduction: process.argv.includes("migrate"),
  });
  return url;
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/platform/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl(),
  },
});
