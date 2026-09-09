import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { withTestDb } from "@/db/test/harness";
import { user } from "@/db/schema/auth.ts";
import { findLastFakeSentEmail } from "@/modules/auth/email/fake-email-repository";
import { TERMS_VERSION } from "@/modules/auth/terms";

import { POST } from "./route";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

beforeEach(() => {
  process.env.REGISTRATION_MODE = "open";
});

function signUpRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost:3000/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/sign-up/email enforces policy at the HTTP layer", () => {
  it("refuses sign-up when REGISTRATION_MODE is closed and terms were not accepted, creating no user and sending no email", async () => {
    await withTestDb(async (db) => {
      process.env.REGISTRATION_MODE = "closed";
      const email = "http-closed-no-terms@example.com";

      const response = await POST(
        signUpRequest({ name: "Direct Post", email, password: "correct-horse" }),
      );

      expect(response.ok).toBe(false);

      const rows = await db.select().from(user).where(eq(user.email, email));
      expect(rows).toHaveLength(0);
      expect(await findLastFakeSentEmail(db, email)).toBeUndefined();
    });
  });

  it("refuses sign-up posted directly without a terms acceptance, even when registration is open", async () => {
    await withTestDb(async (db) => {
      const email = "http-open-no-terms@example.com";

      const response = await POST(
        signUpRequest({ name: "Direct Post", email, password: "correct-horse" }),
      );

      expect(response.ok).toBe(false);

      const rows = await db.select().from(user).where(eq(user.email, email));
      expect(rows).toHaveLength(0);
      expect(await findLastFakeSentEmail(db, email)).toBeUndefined();
    });
  });

  it("refuses sign-up posted directly when REGISTRATION_MODE is closed, even with a valid terms acceptance", async () => {
    await withTestDb(async (db) => {
      process.env.REGISTRATION_MODE = "closed";
      const email = "http-closed-with-terms@example.com";

      const response = await POST(
        signUpRequest({
          name: "Direct Post",
          email,
          password: "correct-horse",
          termsVersion: TERMS_VERSION,
          termsAcceptedAt: new Date().toISOString(),
        }),
      );

      expect(response.ok).toBe(false);

      const rows = await db.select().from(user).where(eq(user.email, email));
      expect(rows).toHaveLength(0);
      expect(await findLastFakeSentEmail(db, email)).toBeUndefined();
    });
  });

  it("accepts a direct POST that carries both a valid registration mode and a terms acceptance", async () => {
    await withTestDb(async (db) => {
      const email = "http-open-with-terms@example.com";

      const response = await POST(
        signUpRequest({
          name: "Direct Post",
          email,
          password: "correct-horse",
          termsVersion: TERMS_VERSION,
          termsAcceptedAt: new Date().toISOString(),
        }),
      );

      expect(response.ok).toBe(true);

      const rows = await db.select().from(user).where(eq(user.email, email));
      expect(rows).toHaveLength(1);
    });
  });
});
