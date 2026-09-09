import { drizzle } from "drizzle-orm/neon-serverless";
import { betterAuth } from "better-auth";

import * as schema from "../../db/schema/index.ts";
import { buildAuthOptions } from "./options.ts";

const PLACEHOLDER_CONNECTION = "postgres://placeholder:placeholder@localhost:5432/placeholder";

const placeholderDb = drizzle({ connection: PLACEHOLDER_CONNECTION, schema });

// The Better Auth CLI needs a named `auth` export to introspect the schema
// (auth.ts exports only the lazy `getAuth()` singleton, on purpose, so
// nothing connects to a database or an email provider at import time). This
// placeholder never opens the connection or sends an email, so
// `db:auth-schema` runs without DATABASE_URL, RESEND_API_KEY or
// BETTER_AUTH_SECRET.
export const auth = betterAuth(
  buildAuthOptions(placeholderDb, { ...process.env, EMAIL_PROVIDER: "fake" }),
);
