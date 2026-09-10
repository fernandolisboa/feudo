import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { withTestDb } from "@/db/test/harness";

import { getAuth } from "./auth";
import { fakeEmailSender } from "./email/fake-sender";
import { findLastFakeSentEmail } from "./email/fake-email-repository";
import { extractTokenFromEmail } from "./test/extract-token-from-email";
import { getDb } from "@/db/client";
import { signUp } from "./service";
import { t } from "./strings";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

beforeEach(() => {
  process.env.REGISTRATION_MODE = "open";
});

afterEach(() => {
  vi.restoreAllMocks();
});

const TIMING_FLOOR_LOWER_BOUND_MS = 450;

async function lastEmailTextFor(email: string): Promise<string> {
  const sentEmail = await findLastFakeSentEmail(getDb(), email);
  if (!sentEmail) {
    throw new Error(`no email was sent to ${email}`);
  }
  return sentEmail.text;
}

async function createVerifiedUser(email: string, password: string): Promise<void> {
  const signUpOutcome = await signUp(
    { name: "Timing Floor User", email, password, termsAccepted: true },
    new Headers(),
  );
  if (signUpOutcome.status !== "ok") {
    throw new Error(`sign-up failed with status ${signUpOutcome.status}`);
  }
  await getAuth().api.verifyEmail({
    query: { token: extractTokenFromEmail(await lastEmailTextFor(email)) },
  });
}

// Calls getAuth().handler(...) directly, the way a request straight to
// /api/auth/* (never through service.ts) would, to prove the floor is
// enforced by the Better Auth hook itself rather than by the server action.
async function callAuthHandler(path: string, body: unknown): Promise<Response> {
  return getAuth().handler(
    new Request(`http://localhost:3000/api/auth${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("timing floor on the raw Better Auth handler", () => {
  it("takes at least the floor for /request-password-reset, known and unknown email", async () => {
    await withTestDb(async () => {
      const knownEmail = "timing-handler-known-reset@example.com";
      await createVerifiedUser(knownEmail, "correct-horse");

      const knownStart = Date.now();
      const knownResponse = await callAuthHandler("/request-password-reset", {
        email: knownEmail,
        redirectTo: "/redefinir-senha",
      });
      const knownElapsed = Date.now() - knownStart;
      expect(knownResponse.ok).toBe(true);
      expect(knownElapsed).toBeGreaterThanOrEqual(TIMING_FLOOR_LOWER_BOUND_MS);

      const unknownStart = Date.now();
      const unknownResponse = await callAuthHandler("/request-password-reset", {
        email: "timing-handler-unknown-reset@example.com",
        redirectTo: "/redefinir-senha",
      });
      const unknownElapsed = Date.now() - unknownStart;
      expect(unknownResponse.ok).toBe(true);
      expect(unknownElapsed).toBeGreaterThanOrEqual(TIMING_FLOOR_LOWER_BOUND_MS);
    });
  });

  it("still takes at least the floor when /request-password-reset gets a malformed email (400)", async () => {
    await withTestDb(async () => {
      const start = Date.now();
      const response = await callAuthHandler("/request-password-reset", {
        email: "not-an-email",
        redirectTo: "/redefinir-senha",
      });
      const elapsed = Date.now() - start;
      expect(response.status).toBe(400);
      expect(elapsed).toBeGreaterThanOrEqual(TIMING_FLOOR_LOWER_BOUND_MS);
    });
  });

  it("takes at least the floor for /sign-in/magic-link, known and unknown email", async () => {
    await withTestDb(async () => {
      const knownEmail = "timing-handler-known-magic-link@example.com";
      await createVerifiedUser(knownEmail, "correct-horse");

      const knownStart = Date.now();
      const knownResponse = await callAuthHandler("/sign-in/magic-link", {
        email: knownEmail,
        callbackURL: "/",
        errorCallbackURL: "/entrar/link-magico",
      });
      const knownElapsed = Date.now() - knownStart;
      expect(knownResponse.ok).toBe(true);
      expect(knownElapsed).toBeGreaterThanOrEqual(TIMING_FLOOR_LOWER_BOUND_MS);

      const unknownStart = Date.now();
      const unknownResponse = await callAuthHandler("/sign-in/magic-link", {
        email: "timing-handler-unknown-magic-link@example.com",
        callbackURL: "/",
        errorCallbackURL: "/entrar/link-magico",
      });
      const unknownElapsed = Date.now() - unknownStart;
      expect(unknownResponse.ok).toBe(true);
      expect(unknownElapsed).toBeGreaterThanOrEqual(TIMING_FLOOR_LOWER_BOUND_MS);
    });
  });

  it("still floors and returns 200 for a known email when the email provider fails to send the magic link", async () => {
    await withTestDb(async () => {
      const knownEmail = "timing-handler-provider-failure-magic-link@example.com";
      await createVerifiedUser(knownEmail, "correct-horse");
      const emailBeforeRequest = await findLastFakeSentEmail(getDb(), knownEmail);
      vi.spyOn(fakeEmailSender, "send").mockRejectedValueOnce(new Error("provider down"));

      const start = Date.now();
      const response = await callAuthHandler("/sign-in/magic-link", {
        email: knownEmail,
        callbackURL: "/",
        errorCallbackURL: "/entrar/link-magico",
      });
      const elapsed = Date.now() - start;

      expect(response.status).toBe(200);
      expect(elapsed).toBeGreaterThanOrEqual(TIMING_FLOOR_LOWER_BOUND_MS);

      const emailAfterRequest = await findLastFakeSentEmail(getDb(), knownEmail);
      expect(emailAfterRequest).toEqual(emailBeforeRequest);
      expect(emailAfterRequest?.subject).not.toBe(t.magicLinkEmail.subject);
    });
  });
});
