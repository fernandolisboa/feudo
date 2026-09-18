import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { withTestDb } from "@/platform/db/test/harness";
import { user } from "@/modules/auth/schema.ts";

import type { Database } from "@/platform/db/client";
import { getAuth } from "./auth";
import { readAuthBaseUrl } from "./env";
import { TERMS_VERSION } from "./terms";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

beforeEach(() => {
  process.env.REGISTRATION_MODE = "open";
});

async function themeColumnFor(db: Database, email: string): Promise<string | undefined> {
  const [row] = await db.select({ theme: user.theme }).from(user).where(eq(user.email, email));
  return row?.theme;
}

// A malicious or naive client can send any JSON body to /api/auth/sign-up/email
// directly, bypassing our own signUpFormSchema entirely — this exercises that
// raw HTTP path, not the typed api.signUpEmail() wrapper our own service.ts
// uses (whose generated types already exclude input:false fields).
async function rawSignUp(
  body: Record<string, unknown>,
): Promise<{ status: number; user: { id?: string } | undefined }> {
  const url = new URL("/api/auth/sign-up/email", readAuthBaseUrl());
  const response = await getAuth().handler(
    new Request(url, {
      method: "POST",
      headers: new Headers({ "content-type": "application/json" }),
      body: JSON.stringify(body),
    }),
  );
  const json = (await response.json().catch(() => undefined)) as
    { user?: { id?: string } } | undefined;
  return { status: response.status, user: json?.user };
}

describe("sign-up ignores a client-supplied theme (Better Auth's theme field is input: false)", () => {
  it("keeps the caderno default when the client sends a valid theme name", async () => {
    await withTestDb(async (db) => {
      const email = "theme-valid@example.com";

      const { status, user: signedUpUser } = await rawSignUp({
        name: "Theme Valid",
        email,
        password: "correct-horse",
        termsVersion: TERMS_VERSION,
        callbackURL: "/entrar",
        theme: "sala",
      });

      expect(status).toBe(200);
      expect(signedUpUser?.id).toBeTruthy();
      expect(await themeColumnFor(db, email)).toBe("caderno");
    });
  });

  it("keeps the caderno default and never fails sign-up when the client sends an invalid theme name", async () => {
    await withTestDb(async (db) => {
      const email = "theme-invalid@example.com";

      const { status, user: signedUpUser } = await rawSignUp({
        name: "Theme Invalid",
        email,
        password: "correct-horse",
        termsVersion: TERMS_VERSION,
        callbackURL: "/entrar",
        theme: "not-a-real-theme",
      });

      expect(status).toBe(200);
      expect(signedUpUser?.id).toBeTruthy();
      expect(await themeColumnFor(db, email)).toBe("caderno");
    });
  });
});
