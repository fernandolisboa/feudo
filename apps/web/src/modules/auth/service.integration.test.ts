import { beforeEach, describe, expect, it } from "vitest";

import { getDb } from "@/db/client";
import { withTestDb } from "@/db/test/harness";
import { user } from "@/db/schema/auth.ts";
import { eq } from "drizzle-orm";

import { getAuth } from "./auth";
import { fakeEmailSender } from "./email/fake-sender";
import { listTermsAcceptancesForUser } from "./terms-repository";
import { TERMS_VERSION } from "./terms";
import { resendVerification, signIn, signUp } from "./service";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

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

function lastEmailTextFor(email: string): string {
  const sentEmail = fakeEmailSender.lastTo(email);
  if (!sentEmail) {
    throw new Error(`no email was sent to ${email}`);
  }
  return sentEmail.text;
}

async function verifyEmailWithToken(token: string): Promise<{ status: boolean }> {
  const result = await getAuth().api.verifyEmail({ query: { token } });
  if (!result || typeof result.status !== "boolean") {
    throw new Error("verifyEmail did not return a status");
  }
  return result;
}

beforeEach(() => {
  fakeEmailSender.reset();
  process.env.REGISTRATION_MODE = "open";
});

describe("sign-up, verification and sign-in", () => {
  it("registers, verifies and signs in successfully", async () => {
    await withTestDb(async () => {
      const email = "nova@example.com";

      const signUpOutcome = await signUp(
        { name: "Nova User", email, password: "correct-horse", termsAccepted: true },
        new Headers(),
      );
      expect(signUpOutcome.status).toBe("ok");
      if (signUpOutcome.status !== "ok") return;

      const token = extractVerificationToken(lastEmailTextFor(email));
      await verifyEmailWithToken(token);

      const signInOutcome = await signIn({ email, password: "correct-horse" }, new Headers());
      expect(signInOutcome.status).toBe("ok");

      const acceptances = await listTermsAcceptancesForUser(getDb(), signUpOutcome.userId);
      expect(acceptances).toHaveLength(1);
      expect(acceptances[0]?.version).toBe(TERMS_VERSION);
    });
  });

  it("refuses sign-in for an unverified user", async () => {
    await withTestDb(async () => {
      const email = "unverified@example.com";

      const signUpOutcome = await signUp(
        { name: "Unverified User", email, password: "correct-horse", termsAccepted: true },
        new Headers(),
      );
      expect(signUpOutcome.status).toBe("ok");

      const signInOutcome = await signIn({ email, password: "correct-horse" }, new Headers());
      expect(signInOutcome.status).toBe("email_not_verified");
    });
  });

  it("keeps re-using the same verification link a second time harmless", async () => {
    await withTestDb(async () => {
      const email = "single-use@example.com";

      const signUpOutcome = await signUp(
        { name: "Single Use", email, password: "correct-horse", termsAccepted: true },
        new Headers(),
      );
      expect(signUpOutcome.status).toBe("ok");

      const token = extractVerificationToken(lastEmailTextFor(email));

      await verifyEmailWithToken(token);
      const secondAttempt = await verifyEmailWithToken(token);

      expect(secondAttempt.status).toBe(true);

      const signInOutcome = await signIn({ email, password: "correct-horse" }, new Headers());
      expect(signInOutcome.status).toBe("ok");
    });
  });

  it("rejects an invalid verification token, leaving the account unverified", async () => {
    await withTestDb(async () => {
      const email = "invalid-token@example.com";

      const signUpOutcome = await signUp(
        { name: "Invalid Token", email, password: "correct-horse", termsAccepted: true },
        new Headers(),
      );
      expect(signUpOutcome.status).toBe("ok");

      await expect(
        getAuth().api.verifyEmail({ query: { token: "not-a-real-token" } }),
      ).rejects.toThrow();

      const signInOutcome = await signIn({ email, password: "correct-horse" }, new Headers());
      expect(signInOutcome.status).toBe("email_not_verified");
    });
  });

  it("refuses sign-up without accepting the terms", async () => {
    await withTestDb(async () => {
      const outcome = await signUp(
        {
          name: "No Terms",
          email: "no-terms@example.com",
          password: "correct-horse",
          termsAccepted: false,
        },
        new Headers(),
      );
      expect(outcome.status).toBe("terms_not_accepted");
    });
  });

  it("refuses sign-up when REGISTRATION_MODE is closed, without creating a user or sending an email", async () => {
    await withTestDb(async (db) => {
      process.env.REGISTRATION_MODE = "closed";
      const email = "closed@example.com";

      const outcome = await signUp(
        { name: "Closed Mode", email, password: "correct-horse", termsAccepted: true },
        new Headers(),
      );
      expect(outcome.status).toBe("registration_closed");

      const rows = await db.select().from(user).where(eq(user.email, email));
      expect(rows).toHaveLength(0);
      expect(fakeEmailSender.lastTo(email)).toBeUndefined();
    });
  });

  it("refuses sign-up when REGISTRATION_MODE is invite, since invites do not exist yet", async () => {
    await withTestDb(async () => {
      process.env.REGISTRATION_MODE = "invite";
      const outcome = await signUp(
        {
          name: "Invite Mode",
          email: "invite@example.com",
          password: "correct-horse",
          termsAccepted: true,
        },
        new Headers(),
      );
      expect(outcome.status).toBe("invite_required");
    });
  });

  it("records a terms acceptance row with the current version on sign-up", async () => {
    await withTestDb(async () => {
      const email = "terms@example.com";
      const outcome = await signUp(
        { name: "Terms Recorded", email, password: "correct-horse", termsAccepted: true },
        new Headers(),
      );
      expect(outcome.status).toBe("ok");
      if (outcome.status !== "ok") return;

      const acceptances = await listTermsAcceptancesForUser(getDb(), outcome.userId);
      expect(acceptances).toEqual([
        expect.objectContaining({ userId: outcome.userId, version: TERMS_VERSION }),
      ]);
    });
  });

  it("resends the verification email through the fake sender", async () => {
    await withTestDb(async () => {
      const email = "resend@example.com";
      await signUp(
        { name: "Resend Case", email, password: "correct-horse", termsAccepted: true },
        new Headers(),
      );
      fakeEmailSender.reset();

      const outcome = await resendVerification(email);
      expect(outcome.status).toBe("ok");
      expect(fakeEmailSender.lastTo(email)).toBeDefined();
    });
  });
});
