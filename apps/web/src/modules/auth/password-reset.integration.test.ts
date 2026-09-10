import { beforeEach, describe, expect, it } from "vitest";
import { parseSetCookieHeader } from "better-auth/cookies";

import { getDb } from "@/db/client";
import { withTestDb } from "@/db/test/harness";

import { getAuth } from "./auth";
import { extractTokenFromEmail } from "./test/extract-token-from-email";
import { waitForLastFakeSentEmail } from "./test/wait-for-last-fake-sent-email";
import { requestPasswordReset, resetPassword, signIn, signUp } from "./service";
import { t } from "./strings";

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

async function lastVerificationEmailTextFor(email: string): Promise<string> {
  const sentEmail = await waitForLastFakeSentEmail(getDb(), email, {
    subject: t.verificationEmail.subject,
  });
  return sentEmail.text;
}

async function lastResetPasswordEmailTextFor(email: string): Promise<string> {
  const sentEmail = await waitForLastFakeSentEmail(getDb(), email, {
    subject: t.resetPasswordEmail.subject,
  });
  return sentEmail.text;
}

const RESET_TOKEN_CHANGE_TIMEOUT_MS = 3000;
const RESET_TOKEN_CHANGE_POLL_INTERVAL_MS = 25;

// A second reset request re-uses the same subject as the first, so waiting
// on subject alone would happily return the first send's still-fresh row
// before the second insert lands. Polling until the token itself changes is
// what actually proves the second send arrived, not just that some email did.
async function waitForNewResetPasswordToken(email: string, previousToken: string): Promise<string> {
  const deadline = Date.now() + RESET_TOKEN_CHANGE_TIMEOUT_MS;
  for (;;) {
    const token = extractTokenFromEmail(await lastResetPasswordEmailTextFor(email));
    if (token !== previousToken) {
      return token;
    }
    if (Date.now() >= deadline) {
      throw new Error(`timed out waiting for a new reset-password token for ${email}`);
    }
    await new Promise((resolve) => setTimeout(resolve, RESET_TOKEN_CHANGE_POLL_INTERVAL_MS));
  }
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
    query: { token: extractTokenFromEmail(await lastVerificationEmailTextFor(email)) },
  });
}

describe("password reset", () => {
  it("requests a link by email, and using it once sets a new password that signs in", async () => {
    await withTestDb(async () => {
      const email = "reset@example.com";
      await createVerifiedUser(email, "old-password");

      const requestOutcome = await requestPasswordReset(email, new Headers());
      expect(requestOutcome.status).toBe("ok");

      const token = extractTokenFromEmail(await lastResetPasswordEmailTextFor(email));

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
      const token = extractTokenFromEmail(await lastResetPasswordEmailTextFor(email));

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
      const token = extractTokenFromEmail(await lastResetPasswordEmailTextFor(email));
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

  it("takes at least the same floor time for a known and an unknown email, so response timing can't reveal which accounts exist", async () => {
    await withTestDb(async () => {
      const knownEmail = "timing-known-for-reset@example.com";
      await createVerifiedUser(knownEmail, "correct-horse");

      const knownStart = Date.now();
      await requestPasswordReset(knownEmail, new Headers());
      const knownElapsed = Date.now() - knownStart;

      const unknownStart = Date.now();
      await requestPasswordReset("timing-unknown-for-reset@example.com", new Headers());
      const unknownElapsed = Date.now() - unknownStart;

      expect(knownElapsed).toBeGreaterThanOrEqual(450);
      expect(unknownElapsed).toBeGreaterThanOrEqual(450);
    });
  });

  it("invalidates the user's other outstanding reset links once one of them is used", async () => {
    await withTestDb(async () => {
      const email = "reset-invalidates-others@example.com";
      await createVerifiedUser(email, "old-password");

      await requestPasswordReset(email, new Headers());
      const firstToken = extractTokenFromEmail(await lastResetPasswordEmailTextFor(email));

      await requestPasswordReset(email, new Headers());
      const secondToken = await waitForNewResetPasswordToken(email, firstToken);
      expect(secondToken).not.toBe(firstToken);

      const resetOutcome = await resetPassword(
        { token: secondToken, newPassword: "new-password" },
        new Headers(),
      );
      expect(resetOutcome.status).toBe("ok");

      const staleOutcome = await resetPassword(
        { token: firstToken, newPassword: "another-password" },
        new Headers(),
      );
      expect(staleOutcome.status).toBe("invalid_token");
    });
  });
});
