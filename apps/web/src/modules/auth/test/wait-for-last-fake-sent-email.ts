import type { Database } from "@/db/client";
import { findLastFakeSentEmail, type FakeSentEmail } from "../email/fake-email-repository";

const DEFAULT_TIMEOUT_MS = 3000;
const POLL_INTERVAL_MS = 25;

export type WaitForLastFakeSentEmailOptions = {
  subject?: string;
  timeoutMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The response no longer waits for the fake sender's insert (sendResetPassword
// and sendMagicLink schedule the send instead of awaiting it), so a test that
// reads the last e-mail right after the request races the background insert.
// Polling with a subject check closes both gaps at once: it survives a slow,
// remote Neon connection without an absolute ceiling, and the subject match
// stops a stale row from an earlier send in the same test from masquerading
// as the one the request just triggered.
export async function waitForLastFakeSentEmail(
  db: Database,
  to: string,
  options: WaitForLastFakeSentEmailOptions = {},
): Promise<FakeSentEmail> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const deadline = Date.now() + timeoutMs;

  let lastSeen: FakeSentEmail | undefined;
  for (;;) {
    const sentEmail = await findLastFakeSentEmail(db, to);
    if (sentEmail && (options.subject === undefined || sentEmail.subject === options.subject)) {
      return sentEmail;
    }
    lastSeen = sentEmail;
    if (Date.now() >= deadline) {
      break;
    }
    await sleep(POLL_INTERVAL_MS);
  }

  const subjectSuffix = options.subject ? ` with subject "${options.subject}"` : "";
  const seenSuffix = lastSeen ? `; last seen subject was "${lastSeen.subject}"` : "";
  throw new Error(
    `timed out after ${String(timeoutMs)}ms waiting for an email to ${to}${subjectSuffix}${seenSuffix}`,
  );
}
