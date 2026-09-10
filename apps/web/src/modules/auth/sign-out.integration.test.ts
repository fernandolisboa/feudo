import { describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { parseSetCookieHeader } from "better-auth/cookies";

import { withTestDb } from "@/db/test/harness";
import { rateLimit } from "@/db/schema/auth";

// signOutAction is a Server Action: it reaches next/headers and
// next/navigation directly, which throw outside a real request. These stubs
// let the real service.signOut (and so the real DB-backed rate limiter) run
// against a fake request instead of mocking service.ts itself.
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
);
vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers()),
  cookies: () =>
    Promise.resolve({
      set: () => undefined,
      get: () => undefined,
      delete: () => undefined,
    }),
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import { getAuth } from "./auth";
import { findLastFakeSentEmail } from "./email/fake-email-repository";
import { signOutAction } from "./actions";
import { signOut, signUp } from "./service";
import { t } from "./strings";
import { extractTokenFromEmail } from "./test/extract-token-from-email";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";
process.env.REGISTRATION_MODE = "open";

function cookieHeaderFrom(headers: Headers): string {
  const pairs: string[] = [];
  for (const setCookie of headers.getSetCookie()) {
    for (const [name, attributes] of parseSetCookieHeader(setCookie)) {
      pairs.push(`${name}=${attributes.value}`);
    }
  }
  return pairs.join("; ");
}

describe("signOut", () => {
  it("invalidates the session so it can no longer be used", async () => {
    await withTestDb(async (db) => {
      const email = "sign-out@example.com";
      const password = "correct-horse";

      await signUp({ name: "Sign Out Case", email, password, termsAccepted: true }, new Headers());
      const token = extractTokenFromEmail((await findLastFakeSentEmail(db, email))?.text ?? "");
      await getAuth().api.verifyEmail({ query: { token } });

      const { headers: signInHeaders } = await getAuth().api.signInEmail({
        body: { email, password },
        returnHeaders: true,
      });
      const cookieHeader = cookieHeaderFrom(signInHeaders);
      expect(cookieHeader).not.toBe("");

      const sessionBeforeSignOut = await getAuth().api.getSession({
        headers: new Headers({ cookie: cookieHeader }),
      });
      expect(sessionBeforeSignOut).not.toBeNull();

      await signOut(new Headers({ cookie: cookieHeader }));

      const sessionAfterSignOut = await getAuth().api.getSession({
        headers: new Headers({ cookie: cookieHeader }),
      });
      expect(sessionAfterSignOut).toBeNull();
    });
  });

  it("rate-limits repeated sign-out calls and signOutAction surfaces the error instead of redirecting", async () => {
    await withTestDb(async (db) => {
      // /sign-out has no special or custom rate-limit rule (options.ts), so
      // it falls back to Better Auth's global default: 100 requests per
      // 10-second window (create-context.mjs). One warm-up call learns the
      // key the DB-backed limiter uses (IP prefix + path, an implementation
      // detail not worth pinning); seeding that row at the limit is
      // equivalent to 100 rapid calls without the loop.
      await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT:/entrar");

      const rows = await db.select().from(rateLimit);
      expect(rows).toHaveLength(1);
      const key = rows[0]?.key;
      if (!key) {
        throw new Error("expected the warm-up call to seed a rate_limit row");
      }

      await db
        .update(rateLimit)
        .set({ count: 100, lastRequest: Date.now() })
        .where(eq(rateLimit.key, key));

      const limited = await signOutAction();

      expect(limited).toEqual({ status: "error", message: t.errors.signOutFailed });
    });
  });
});
