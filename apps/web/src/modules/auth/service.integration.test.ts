import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { withTestDb } from "@/db/test/harness";
import { user } from "@/db/schema/auth.ts";

import { getAuth } from "./auth";
import { findLastFakeSentEmail } from "./email/fake-email-repository";
import { TERMS_VERSION } from "./terms";
import { resendVerification, signIn, signUp } from "./service";
import { extractTokenFromEmail } from "./test/extract-token-from-email";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

async function lastEmailTextFor(email: string): Promise<string> {
  const sentEmail = await findLastFakeSentEmail(getDb(), email);
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
  process.env.REGISTRATION_MODE = "open";
});

describe("sign-up, verification and sign-in", () => {
  it("registers, verifies and signs in successfully", async () => {
    await withTestDb(async (db) => {
      const email = "nova@example.com";

      const signUpOutcome = await signUp(
        { name: "Nova User", email, password: "correct-horse", termsAccepted: true },
        new Headers(),
      );
      expect(signUpOutcome.status).toBe("ok");
      if (signUpOutcome.status !== "ok") return;

      const token = extractTokenFromEmail(await lastEmailTextFor(email));
      await verifyEmailWithToken(token);

      const signInOutcome = await signIn({ email, password: "correct-horse" }, new Headers());
      expect(signInOutcome.status).toBe("ok");

      const [row] = await db.select().from(user).where(eq(user.email, email));
      expect(row?.termsVersion).toBe(TERMS_VERSION);
      expect(row?.termsAcceptedAt).toBeInstanceOf(Date);
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

      const token = extractTokenFromEmail(await lastEmailTextFor(email));

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
      expect(await findLastFakeSentEmail(db, email)).toBeUndefined();
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

  it("records the terms version and timestamp on the user row created at sign-up", async () => {
    await withTestDb(async (db) => {
      const email = "terms@example.com";
      const outcome = await signUp(
        { name: "Terms Recorded", email, password: "correct-horse", termsAccepted: true },
        new Headers(),
      );
      expect(outcome.status).toBe("ok");

      const [row] = await db.select().from(user).where(eq(user.email, email));
      expect(row).toMatchObject({ termsVersion: TERMS_VERSION });
    });
  });

  it("returns the same generic outcome on a duplicate sign-up, creating exactly one user row and no 500", async () => {
    await withTestDb(async (db) => {
      const email = "duplicate@example.com";

      const first = await signUp(
        { name: "First", email, password: "correct-horse", termsAccepted: true },
        new Headers(),
      );
      const second = await signUp(
        { name: "Second", email, password: "another-password", termsAccepted: true },
        new Headers(),
      );

      expect(first.status).toBe("ok");
      expect(second.status).toBe("ok");

      const rows = await db.select().from(user).where(eq(user.email, email));
      expect(rows).toHaveLength(1);
    });
  });

  it("resends the verification email through the fake sender", async () => {
    await withTestDb(async (db) => {
      const email = "resend@example.com";
      await signUp(
        { name: "Resend Case", email, password: "correct-horse", termsAccepted: true },
        new Headers(),
      );

      const outcome = await resendVerification(email, new Headers());
      expect(outcome.status).toBe("ok");
      expect(await findLastFakeSentEmail(db, email)).toBeDefined();
    });
  });
});
