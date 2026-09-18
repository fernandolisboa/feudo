import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { withTestDb } from "@/platform/db/test/harness";
import type { Database } from "@/platform/db/client";
import { user } from "@/modules/auth/schema.ts";
import { getAuth } from "@/modules/auth/auth";
import { findLastFakeSentEmail } from "@/modules/auth/email/fake-email-repository";
import { TERMS_VERSION } from "@/modules/auth/terms";
import { extractTokenFromEmail } from "@/modules/auth/test/extract-token-from-email";

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

function signInRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost:3000/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function updateUserRequest(body: Record<string, unknown>, cookieHeader: string): Request {
  return new Request("http://localhost:3000/api/auth/update-user", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: cookieHeader },
    body: JSON.stringify(body),
  });
}

function sessionCookieFrom(response: Response): string {
  const setCookieValues = response.headers.getSetCookie();
  const sessionCookie = setCookieValues.find((value) =>
    value.startsWith("better-auth.session_token="),
  );
  if (!sessionCookie) {
    throw new Error("sign-in response did not set a session cookie");
  }
  return sessionCookie.split(";", 1)[0] as string;
}

async function signUpVerifyAndSignIn(db: Database, email: string): Promise<string> {
  const signUpResponse = await POST(
    signUpRequest({
      name: "Direct Post",
      email,
      password: "correct-horse",
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: new Date().toISOString(),
    }),
  );
  if (!signUpResponse.ok) {
    throw new Error("sign-up failed while preparing an authenticated session");
  }

  const sentEmail = await findLastFakeSentEmail(db, email);
  if (!sentEmail) {
    throw new Error(`no email was sent to ${email}`);
  }
  const token = extractTokenFromEmail(sentEmail.text);
  await getAuth().api.verifyEmail({ query: { token } });

  const signInResponse = await POST(signInRequest({ email, password: "correct-horse" }));
  if (!signInResponse.ok) {
    throw new Error("sign-in failed while preparing an authenticated session");
  }
  return sessionCookieFrom(signInResponse);
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

  it("ignores a forged termsAcceptedAt and stamps the server clock instead", async () => {
    await withTestDb(async (db) => {
      const email = "http-forged-terms-accepted-at@example.com";

      const response = await POST(
        signUpRequest({
          name: "Direct Post",
          email,
          password: "correct-horse",
          termsVersion: TERMS_VERSION,
          termsAcceptedAt: "1999-01-01T00:00:00.000Z",
        }),
      );

      expect(response.ok).toBe(true);

      const [row] = await db.select().from(user).where(eq(user.email, email));
      const storedTermsAcceptedAt = row?.termsAcceptedAt;
      expect(storedTermsAcceptedAt).toBeInstanceOf(Date);
      const ageInMs = Date.now() - (storedTermsAcceptedAt as Date).getTime();
      expect(ageInMs).toBeGreaterThanOrEqual(0);
      expect(ageInMs).toBeLessThan(10_000);
    });
  });

  it("never 500s on an unparseable termsAcceptedAt, stamping the server clock instead", async () => {
    await withTestDb(async (db) => {
      const email = "http-unparseable-terms-accepted-at@example.com";

      const response = await POST(
        signUpRequest({
          name: "Direct Post",
          email,
          password: "correct-horse",
          termsVersion: TERMS_VERSION,
          termsAcceptedAt: "not-a-date",
        }),
      );

      expect(response.status).not.toBe(500);
      expect(response.ok).toBe(true);

      const [row] = await db.select().from(user).where(eq(user.email, email));
      expect(row?.termsAcceptedAt).toBeInstanceOf(Date);
    });
  });
});

describe("POST /api/auth/update-user refuses consent fields", () => {
  it("refuses a termsVersion in the update-user body, leaving the user row unchanged", async () => {
    await withTestDb(async (db) => {
      const email = "http-update-user-terms-version@example.com";
      const sessionCookie = await signUpVerifyAndSignIn(db, email);
      const [before] = await db.select().from(user).where(eq(user.email, email));

      const response = await POST(updateUserRequest({ termsVersion: "v99" }, sessionCookie));

      expect(response.status).toBe(400);

      const [after] = await db.select().from(user).where(eq(user.email, email));
      expect(after).toEqual(before);
    });
  });

  it("accepts a plain name update", async () => {
    await withTestDb(async (db) => {
      const email = "http-update-user-name@example.com";
      const sessionCookie = await signUpVerifyAndSignIn(db, email);

      const response = await POST(updateUserRequest({ name: "Novo nome" }, sessionCookie));

      expect(response.ok).toBe(true);

      const [after] = await db.select().from(user).where(eq(user.email, email));
      expect(after?.name).toBe("Novo nome");
    });
  });
});

describe("POST /api/auth/update-user refuses the theme field (input: false)", () => {
  it("refuses a theme in the update-user body, leaving the user row unchanged", async () => {
    await withTestDb(async (db) => {
      const email = "http-update-user-theme@example.com";
      const sessionCookie = await signUpVerifyAndSignIn(db, email);
      const [before] = await db.select().from(user).where(eq(user.email, email));

      const response = await POST(updateUserRequest({ theme: "sala" }, sessionCookie));

      expect(response.status).toBe(400);

      const [after] = await db.select().from(user).where(eq(user.email, email));
      expect(after).toEqual(before);
      expect(after?.theme).toBe("caderno");
    });
  });
});
