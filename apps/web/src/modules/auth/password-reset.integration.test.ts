import { beforeEach, describe, expect, it } from "vitest";
import { parseSetCookieHeader } from "better-auth/cookies";

import { getDb } from "@/db/client";
import { withTestDb } from "@/db/test/harness";

import { getAuth } from "./auth";
import { findLastFakeSentEmail } from "./email/fake-email-repository";
import { extractTokenFromEmail } from "./test/extract-token-from-email";
import { requestPasswordReset, resetPassword, signIn, signUp } from "./service";

function cookieHeaderFrom(headers: Headers): string {
  const pairs: string[] = [];
  for (const setCookie of headers.getSetCookie()) {
    for (const [name, attributes] of parseSetCookieHeader(setCookie)) {
      pairs.push(`${name}=${attributes.value}`);
    }
  }
  return pairs.join("; ");
}

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

beforeEach(() => {
  process.env.REGISTRATION_MODE = "open";
});

async function lastEmailTextFor(email: string): Promise<string> {
  const sentEmail = await findLastFakeSentEmail(getDb(), email);
  if (!sentEmail) {
    throw new Error(`no email was sent to ${email}`);
  }
  return sentEmail.text;
}

async function createVerifiedUser(email: string, password: string): Promise<void> {
  const signUpOutcome = await signUp(
    { name: "Password Reset User", email, password, termsAccepted: true },
    new Headers(),
  );
  if (signUpOutcome.status !== "ok") {
    throw new Error(`sign-up failed with status ${signUpOutcome.status}`);
  }
  await getAuth().api.verifyEmail({
    query: { token: extractTokenFromEmail(await lastEmailTextFor(email)) },
  });
}

describe("password reset", () => {
  it("requests a link by email, and using it once sets a new password that signs in", async () => {
    await withTestDb(async () => {
      const email = "reset@example.com";
      await createVerifiedUser(email, "old-password");

      const requestOutcome = await requestPasswordReset(email, new Headers());
      expect(requestOutcome.status).toBe("ok");

      const token = extractTokenFromEmail(await lastEmailTextFor(email));

      const resetOutcome = await resetPassword(
        { token, newPassword: "new-password" },
        new Headers(),
      );
      expect(resetOutcome.status).toBe("ok");

      const oldPasswordOutcome = await signIn({ email, password: "old-password" }, new Headers());
      expect(oldPasswordOutcome.status).toBe("invalid_credentials");

      const newPasswordOutcome = await signIn({ email, password: "new-password" }, new Headers());
      expect(newPasswordOutcome.status).toBe("ok");
    });
  });

  it("consumes the link on first use: reusing the same token fails", async () => {
    await withTestDb(async () => {
      const email = "single-use-reset@example.com";
      await createVerifiedUser(email, "old-password");

      await requestPasswordReset(email, new Headers());
      const token = extractTokenFromEmail(await lastEmailTextFor(email));

      const first = await resetPassword({ token, newPassword: "new-password-1" }, new Headers());
      expect(first.status).toBe("ok");

      const second = await resetPassword({ token, newPassword: "new-password-2" }, new Headers());
      expect(second.status).toBe("invalid_token");
    });
  });

  it("rejects an unknown or malformed token without changing any password", async () => {
    await withTestDb(async () => {
      const outcome = await resetPassword(
        { token: "not-a-real-token", newPassword: "new-password" },
        new Headers(),
      );
      expect(outcome.status).toBe("invalid_token");
    });
  });

  it("revokes the user's existing sessions when the password is reset", async () => {
    await withTestDb(async () => {
      const email = "revoke-sessions@example.com";
      const oldPassword = "old-password";
      await createVerifiedUser(email, oldPassword);

      const { headers: signInHeaders } = await getAuth().api.signInEmail({
        body: { email, password: oldPassword },
        returnHeaders: true,
      });
      const cookieHeader = cookieHeaderFrom(signInHeaders);
      expect(cookieHeader).not.toBe("");

      const sessionBeforeReset = await getAuth().api.getSession({
        headers: new Headers({ cookie: cookieHeader }),
      });
      expect(sessionBeforeReset).not.toBeNull();

      await requestPasswordReset(email, new Headers());
      const token = extractTokenFromEmail(await lastEmailTextFor(email));
      const resetOutcome = await resetPassword(
        { token, newPassword: "new-password" },
        new Headers(),
      );
      expect(resetOutcome.status).toBe("ok");

      const sessionAfterReset = await getAuth().api.getSession({
        headers: new Headers({ cookie: cookieHeader }),
      });
      expect(sessionAfterReset).toBeNull();
    });
  });

  it("responds identically for a known and an unknown email, so requesting a reset never confirms a sign-up exists", async () => {
    await withTestDb(async () => {
      const knownEmail = "known-for-reset@example.com";
      await createVerifiedUser(knownEmail, "correct-horse");

      const knownOutcome = await requestPasswordReset(knownEmail, new Headers());
      const unknownOutcome = await requestPasswordReset(
        "unknown-for-reset@example.com",
        new Headers(),
      );

      expect(knownOutcome).toEqual({ status: "ok" });
      expect(unknownOutcome).toEqual(knownOutcome);
    });
  });
});
