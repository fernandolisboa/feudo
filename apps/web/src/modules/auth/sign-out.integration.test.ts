import { describe, expect, it } from "vitest";
import { parseSetCookieHeader } from "better-auth/cookies";

import { withTestDb } from "@/db/test/harness";

import { getAuth } from "./auth";
import { findLastFakeSentEmail } from "./email/fake-email-repository";
import { signOut, signUp } from "./service";
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
});
