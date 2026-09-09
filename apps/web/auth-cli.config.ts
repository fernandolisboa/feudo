import { drizzle } from "drizzle-orm/neon-serverless";
import { betterAuth } from "better-auth";
import * as schema from "./src/db/schema/index.ts";
import { buildAuthOptions } from "./src/modules/auth/options.ts";

const placeholderDb = drizzle({
  connection: "postgres://placeholder:placeholder@localhost:5432/placeholder",
  schema,
});

export const auth = betterAuth(buildAuthOptions(placeholderDb));
