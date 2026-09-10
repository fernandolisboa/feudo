import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { withTestDb } from "@/db/test/harness";
import { user } from "@/db/schema/auth.ts";

import { getAuth } from "./auth";
import { findLastFakeSentEmail } from "./email/fake-email-repository";
import { extractTokenFromEmail } from "./test/extract-token-from-email";
import { waitForLastFakeSentEmail } from "./test/wait-for-last-fake-sent-email";
import { requestMagicLink, signIn, signUp } from "./service";
import { t } from "./strings";

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

async function lastMagicLinkEmailTextFor(email: string): Promise<string> {
  const sentEmail = await waitForLastFakeSentEmail(getDb(), email, {
    subject: t.magicLinkEmail.subject,
  });
  return sentEmail.text;
}

async function createVerifiedUser(email: string, password: string): Promise<void> {
  const signUpOutcome = await signUp(
    { name: "Magic Link User", email, password, termsAccepted: true },
    new Headers(),
  );
  if (signUpOutcome.status !== "ok") {
    throw new Error(`sign-up failed with status ${signUpOutcome.status}`);
  }
  await getAuth().api.verifyEmail({
    query: { token: extractTokenFromEmail(await lastVerificationEmailTextFor(email)) },
  });
}

describe("magic link sign-in", () => {
  it("requests a link by email, and clicking it once signs the user in", async () => {
    await withTestDb(async () => {
      const email = "magic-link@example.com";
      await createVerifiedUser(email, "correct-horse");

      const requestOutcome = await requestMagicLink(email, new Headers());
      expect(requestOutcome.status).toBe("ok");

      const token = extractTokenFromEmail(await lastMagicLinkEmailTextFor(email));

      const result = await getAuth().api.magicLinkVerify({
        query: { token },
        headers: new Headers(),
      });
      expect(result.user.email).toBe(email);
      expect(result.session.userId).toBe(result.user.id);
    });
  });

  it("consumes the link on first use: a second click on the same link fails", async () => {
    await withTestDb(async () => {
      const email = "single-use-magic-link@example.com";
      await createVerifiedUser(email, "correct-horse");

      await requestMagicLink(email, new Headers());
      const token = extractTokenFromEmail(await lastMagicLinkEmailTextFor(email));

      const first = await getAuth().api.magicLinkVerify({
        query: { token },
        headers: new Headers(),
      });
      expect(first.user.email).toBe(email);

      await expect(
        getAuth().api.magicLinkVerify({ query: { token }, headers: new Headers() }),
      ).rejects.toThrow();
    });
  });

  it("never sends an email or creates an account for an address with no sign-up (disableSignUp)", async () => {
    await withTestDb(async (db) => {
      const email = "no-account@example.com";

      const requestOutcome = await requestMagicLink(email, new Headers());
      expect(requestOutcome.status).toBe("ok");

      // Better Auth's own endpoint still mints and stores a verification
      // token before calling sendMagicLink, regardless of whether the
      // address has an account; what must never happen is Feudo mailing a
      // stranger, so the only externally observable proof is the absence of
      // that email — there is no token left to hand to magicLinkVerify.
      expect(await findLastFakeSentEmail(db, email)).toBeUndefined();

      const rows = await db.select().from(user).where(eq(user.email, email));
      expect(rows).toHaveLength(0);
    });
  });

  it("promotes an unverified user's account access on a successful click and revokes their password", async () => {
    await withTestDb(async () => {
      const email = "unverified-magic-link@example.com";
      const password = "correct-horse";

      const signUpOutcome = await signUp(
        { name: "Unverified Magic Link", email, password, termsAccepted: true },
        new Headers(),
      );
      expect(signUpOutcome.status).toBe("ok");

      const requestOutcome = await requestMagicLink(email, new Headers());
      expect(requestOutcome.status).toBe("ok");
      const token = extractTokenFromEmail(await lastMagicLinkEmailTextFor(email));

      const result = await getAuth().api.magicLinkVerify({
        query: { token },
        headers: new Headers(),
      });
      expect(result.user.email).toBe(email);
      expect(result.user.emailVerified).toBe(true);

      // revokeUnprovenAccountAccess (docs/runbooks/auth.md, "Magic link
      // never signs up") deleted the credential account created at sign-up;
      // the old password no longer works, and the sign-in UI always links
      // to /esqueci-a-senha for exactly this recovery path.
      const signInOutcome = await signIn({ email, password }, new Headers());
      expect(signInOutcome.status).toBe("invalid_credentials");
    });
  });

  it("responds identically for a known and an unknown email, so requesting a link never confirms a sign-up exists", async () => {
    await withTestDb(async () => {
      const knownEmail = "known-for-magic-link@example.com";
      await createVerifiedUser(knownEmail, "correct-horse");

      const knownOutcome = await requestMagicLink(knownEmail, new Headers());
      const unknownOutcome = await requestMagicLink(
        "unknown-for-magic-link@example.com",
        new Headers(),
      );

      expect(knownOutcome).toEqual({ status: "ok" });
      expect(unknownOutcome).toEqual(knownOutcome);
    });
  });

  it("takes at least the same floor time for a known and an unknown email, so response timing can't reveal which accounts exist", async () => {
    await withTestDb(async () => {
      const knownEmail = "timing-known-for-magic-link@example.com";
      await createVerifiedUser(knownEmail, "correct-horse");

      const knownStart = Date.now();
      await requestMagicLink(knownEmail, new Headers());
      const knownElapsed = Date.now() - knownStart;

      const unknownStart = Date.now();
      await requestMagicLink("timing-unknown-for-magic-link@example.com", new Headers());
      const unknownElapsed = Date.now() - unknownStart;

      expect(knownElapsed).toBeGreaterThanOrEqual(450);
      expect(unknownElapsed).toBeGreaterThanOrEqual(450);
    });
  });

  it("still lets the same user sign in with their password after using a magic link", async () => {
    await withTestDb(async () => {
      const email = "magic-link-then-password@example.com";
      const password = "correct-horse";
      await createVerifiedUser(email, password);

      await requestMagicLink(email, new Headers());
      const token = extractTokenFromEmail(await lastMagicLinkEmailTextFor(email));
      await getAuth().api.magicLinkVerify({ query: { token }, headers: new Headers() });

      const signInOutcome = await signIn({ email, password }, new Headers());
      expect(signInOutcome.status).toBe("ok");
    });
  });
});
