import { betterAuth } from "better-auth";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { withTestDb } from "@/platform/db/test/harness";
import type { RuntimeSettings } from "@/platform/runtime-settings";
import { buildAuthOptions } from "./options";
import { user } from "./schema";
import { TERMS_VERSION } from "./terms";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";

function settingsWith(registrationMode: unknown): RuntimeSettings {
  return {
    read: (key) => Promise.resolve(key === "registration_mode" ? registrationMode : undefined),
  };
}

function signUpRequest(email: string): Request {
  return new Request("http://localhost:3000/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Store Mode",
      email,
      password: "correct-horse",
      termsVersion: TERMS_VERSION,
    }),
  });
}

describe("sign-up reads the registration mode from the runtime settings store", () => {
  it("refuses sign-up when the store says closed even though the environment says open", async () => {
    await withTestDb(async (db) => {
      const auth = betterAuth(
        buildAuthOptions(
          db,
          { ...process.env, EMAIL_PROVIDER: "fake", REGISTRATION_MODE: "open" },
          settingsWith("closed"),
        ),
      );
      const email = "store-closed@example.com";

      const response = await auth.handler(signUpRequest(email));

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ message: "registration_closed" });
      const rows = await db.select().from(user).where(eq(user.email, email));
      expect(rows).toHaveLength(0);
    });
  });

  it("allows sign-up when the store says open even though the environment says closed", async () => {
    await withTestDb(async (db) => {
      const auth = betterAuth(
        buildAuthOptions(
          db,
          { ...process.env, EMAIL_PROVIDER: "fake", REGISTRATION_MODE: "closed" },
          settingsWith("open"),
        ),
      );
      const email = "store-open@example.com";

      const response = await auth.handler(signUpRequest(email));

      expect(response.ok).toBe(true);
      const rows = await db.select().from(user).where(eq(user.email, email));
      expect(rows).toHaveLength(1);
    });
  });

  it("falls back to the environment when the store has no value", async () => {
    await withTestDb(async (db) => {
      const auth = betterAuth(
        buildAuthOptions(
          db,
          { ...process.env, EMAIL_PROVIDER: "fake", REGISTRATION_MODE: "closed" },
          settingsWith(undefined),
        ),
      );

      const response = await auth.handler(signUpRequest("store-unset@example.com"));

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ message: "registration_closed" });
    });
  });
});
