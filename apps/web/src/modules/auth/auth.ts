import { betterAuth } from "better-auth";
import { getDb } from "@/db/client";
import { buildAuthOptions } from "./options";

type Auth = ReturnType<typeof betterAuth>;

let cachedAuth: Auth | undefined;

export function getAuth(): Auth {
  if (cachedAuth) {
    return cachedAuth;
  }
  cachedAuth = betterAuth(buildAuthOptions(getDb()));
  return cachedAuth;
}
