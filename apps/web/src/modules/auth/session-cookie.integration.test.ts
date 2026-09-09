import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = vi.hoisted(() => new Map<string, string>());
const recordedSetOptions = vi.hoisted(() => [] as Record<string, unknown>[]);

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      set: (name: string, value: string, options?: Record<string, unknown>) => {
        cookieJar.set(name, value);
        recordedSetOptions.push(options ?? {});
      },
      get: (name: string) => {
        const value = cookieJar.get(name);
        return value === undefined ? undefined : { name, value };
      },
      delete: (name: string) => {
        cookieJar.delete(name);
      },
    }),
  headers: () =>
    Promise.resolve(
      new Headers({
        cookie: Array.from(cookieJar.entries())
          .map(([name, value]) => `${name}=${value}`)
          .join("; "),
      }),
    ),
}));

import { headers } from "next/headers";

import { withTestDb } from "@/db/test/harness";

import { getAuth } from "./auth";
import { findLastFakeSentEmail } from "./email/fake-email-repository";
import { getCurrentSession } from "./session";
import { signIn, signOut, signUp } from "./service";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";
process.env.REGISTRATION_MODE = "open";

function extractVerificationToken(emailText: string): string {
  const match = /https?:\/\/\S+/.exec(emailText);
  if (!match) {
    throw new Error("verification email did not contain a link");
  }
  const token = new URL(match[0]).searchParams.get("token");
  if (!token) {
    throw new Error("verification link did not contain a token");
  }
  return token;
}

beforeEach(() => {
  cookieJar.clear();
  recordedSetOptions.length = 0;
});

describe("session cookie persistence through the auth handler", () => {
  it("persists the session cookie set by signIn so getCurrentSession resolves it, and signOut clears it", async () => {
    await withTestDb(async (db) => {
      const email = "cookie-session@example.com";
      const password = "correct-horse";

      const signUpOutcome = await signUp(
        { name: "Cookie Session", email, password, termsAccepted: true },
        new Headers(),
      );
      expect(signUpOutcome.status).toBe("ok");

      const token = extractVerificationToken((await findLastFakeSentEmail(db, email))?.text ?? "");
      await getAuth().api.verifyEmail({ query: { token } });

      expect(cookieJar.size).toBe(0);

      const signInOutcome = await signIn({ email, password }, new Headers());
      expect(signInOutcome.status).toBe("ok");
      expect(cookieJar.size).toBeGreaterThan(0);

      const session = await getCurrentSession();
      expect(session?.email).toBe(email);

      await signOut(await headers());

      const sessionAfterSignOut = await getCurrentSession();
      expect(sessionAfterSignOut).toBeNull();
    });
  });

  it("sets the session cookie httpOnly and sameSite=lax", async () => {
    await withTestDb(async (db) => {
      const email = "cookie-options@example.com";
      const password = "correct-horse";

      await signUp({ name: "Cookie Options", email, password, termsAccepted: true }, new Headers());

      const token = extractVerificationToken((await findLastFakeSentEmail(db, email))?.text ?? "");
      await getAuth().api.verifyEmail({ query: { token } });

      recordedSetOptions.length = 0;
      await signIn({ email, password }, new Headers());

      expect(recordedSetOptions.length).toBeGreaterThan(0);
      for (const options of recordedSetOptions) {
        expect(options.httpOnly).toBe(true);
        expect(options.sameSite).toBe("lax");
      }
    });
  });
});
