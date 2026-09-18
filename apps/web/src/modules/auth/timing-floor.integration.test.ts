import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

import { withTestDb } from "@/platform/db/test/harness";

import { getAuth } from "./auth";
import { fakeEmailSender } from "./email/fake-sender";
import { findLastFakeSentEmail } from "./email/fake-email-repository";
import { extractTokenFromEmail } from "./test/extract-token-from-email";
import { getDb } from "@/platform/db/client";
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

const CONSOLE_ERROR_WAIT_TIMEOUT_MS = 3000;
const CONSOLE_ERROR_WAIT_POLL_INTERVAL_MS = 10;

// logSendFailure runs inside the scheduled send's own .catch, off
// the response path (that is the point of this ticket) — so a test that
// wants to see it fire must poll rather than assume it already ran by the
// time the request handler's promise resolved.
async function waitForConsoleErrorCall(
  spy: MockInstance<(...args: unknown[]) => void>,
): Promise<void> {
  const deadline = Date.now() + CONSOLE_ERROR_WAIT_TIMEOUT_MS;
  while (spy.mock.calls.length === 0) {
    if (Date.now() >= deadline) {
      throw new Error("timed out waiting for console.error to be called");
    }
    await new Promise((resolve) => setTimeout(resolve, CONSOLE_ERROR_WAIT_POLL_INTERVAL_MS));
  }
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
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

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

      await waitForConsoleErrorCall(consoleErrorSpy);
      expect(consoleErrorSpy).toHaveBeenCalledWith("magic-link email send failed", "Error");
      expect(consoleErrorSpy.mock.calls.flat()).not.toContain(knownEmail);
    });
  });

  it("still floors and returns 200 for a known email when the email provider fails to send the reset-password link", async () => {
    await withTestDb(async () => {
      const knownEmail = "timing-handler-provider-failure-reset@example.com";
      await createVerifiedUser(knownEmail, "correct-horse");
      const emailBeforeRequest = await findLastFakeSentEmail(getDb(), knownEmail);
      vi.spyOn(fakeEmailSender, "send").mockRejectedValueOnce(new Error("provider down"));
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

      const start = Date.now();
      const response = await callAuthHandler("/request-password-reset", {
        email: knownEmail,
        redirectTo: "/redefinir-senha",
      });
      const elapsed = Date.now() - start;

      expect(response.status).toBe(200);
      expect(elapsed).toBeGreaterThanOrEqual(TIMING_FLOOR_LOWER_BOUND_MS);

      const emailAfterRequest = await findLastFakeSentEmail(getDb(), knownEmail);
      expect(emailAfterRequest).toEqual(emailBeforeRequest);
      expect(emailAfterRequest?.subject).not.toBe(t.resetPasswordEmail.subject);

      await waitForConsoleErrorCall(consoleErrorSpy);
      expect(consoleErrorSpy).toHaveBeenCalledWith("reset-password email send failed", "Error");
      expect(consoleErrorSpy.mock.calls.flat()).not.toContain(knownEmail);
    });
  });

  // A provider slower than the floor must never leak into the response: the
  // send now runs off the response path (scheduleBackgroundTask,
  // background-tasks.ts, wired into sendResetPassword/sendMagicLink in
  // options.ts), so a known address should take no longer than an unknown
  // one even when SLOW_SEND_MS comfortably exceeds the floor. Asserted two
  // ways: the relative property under test (known finishes well inside
  // SLOW_SEND_MS, and known/unknown stay close to each other — not an
  // absolute ceiling, which a slow remote Neon connection could blow through
  // on its own), and a deterministic proof that the send genuinely kept
  // running after the response: `sendSettled` flips only once the mocked
  // provider's own sleep finishes.
  const SLOW_SEND_MS = 900;
  const TIMING_ELAPSED_TOLERANCE_MS = 200;

  async function sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  it("keeps /request-password-reset within the floor bound for known and unknown email when the provider is slower than the floor", async () => {
    await withTestDb(async () => {
      const knownEmail = "timing-slow-provider-known-reset@example.com";
      await createVerifiedUser(knownEmail, "correct-horse");
      let sendSettled = false;
      const sendMock = vi.spyOn(fakeEmailSender, "send").mockImplementation(async () => {
        await sleep(SLOW_SEND_MS);
        sendSettled = true;
      });

      const knownStart = Date.now();
      const knownResponse = await callAuthHandler("/request-password-reset", {
        email: knownEmail,
        redirectTo: "/redefinir-senha",
      });
      const knownElapsed = Date.now() - knownStart;
      expect(knownResponse.ok).toBe(true);
      expect(knownElapsed).toBeGreaterThanOrEqual(TIMING_FLOOR_LOWER_BOUND_MS);
      expect(knownElapsed).toBeLessThan(SLOW_SEND_MS);
      expect(sendMock).toHaveBeenCalled();
      expect(sendSettled).toBe(false);

      const unknownStart = Date.now();
      const unknownResponse = await callAuthHandler("/request-password-reset", {
        email: "timing-slow-provider-unknown-reset@example.com",
        redirectTo: "/redefinir-senha",
      });
      const unknownElapsed = Date.now() - unknownStart;
      expect(unknownResponse.ok).toBe(true);
      expect(unknownElapsed).toBeGreaterThanOrEqual(TIMING_FLOOR_LOWER_BOUND_MS);
      expect(Math.abs(knownElapsed - unknownElapsed)).toBeLessThan(TIMING_ELAPSED_TOLERANCE_MS);

      await sleep(SLOW_SEND_MS);
      expect(sendSettled).toBe(true);
    });
  });

  it("keeps /sign-in/magic-link within the floor bound for known and unknown email when the provider is slower than the floor", async () => {
    await withTestDb(async () => {
      const knownEmail = "timing-slow-provider-known-magic-link@example.com";
      await createVerifiedUser(knownEmail, "correct-horse");
      let sendSettled = false;
      const sendMock = vi.spyOn(fakeEmailSender, "send").mockImplementation(async () => {
        await sleep(SLOW_SEND_MS);
        sendSettled = true;
      });

      const knownStart = Date.now();
      const knownResponse = await callAuthHandler("/sign-in/magic-link", {
        email: knownEmail,
        callbackURL: "/",
        errorCallbackURL: "/entrar/link-magico",
      });
      const knownElapsed = Date.now() - knownStart;
      expect(knownResponse.ok).toBe(true);
      expect(knownElapsed).toBeGreaterThanOrEqual(TIMING_FLOOR_LOWER_BOUND_MS);
      expect(knownElapsed).toBeLessThan(SLOW_SEND_MS);
      expect(sendMock).toHaveBeenCalled();
      expect(sendSettled).toBe(false);

      const unknownStart = Date.now();
      const unknownResponse = await callAuthHandler("/sign-in/magic-link", {
        email: "timing-slow-provider-unknown-magic-link@example.com",
        callbackURL: "/",
        errorCallbackURL: "/entrar/link-magico",
      });
      const unknownElapsed = Date.now() - unknownStart;
      expect(unknownResponse.ok).toBe(true);
      expect(unknownElapsed).toBeGreaterThanOrEqual(TIMING_FLOOR_LOWER_BOUND_MS);
      expect(Math.abs(knownElapsed - unknownElapsed)).toBeLessThan(TIMING_ELAPSED_TOLERANCE_MS);

      await sleep(SLOW_SEND_MS);
      expect(sendSettled).toBe(true);
    });
  });
});
