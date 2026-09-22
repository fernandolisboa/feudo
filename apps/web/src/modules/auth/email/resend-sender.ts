import { Resend } from "resend";
import type { AuthEnv } from "../env";
import type { EmailSender, SendEmailInput } from "./sender";

export class MissingResendApiKeyError extends Error {
  constructor() {
    super("RESEND_API_KEY is not set");
    this.name = "MissingResendApiKeyError";
  }
}

export class MissingEmailFromError extends Error {
  constructor() {
    super("EMAIL_FROM is not set");
    this.name = "MissingEmailFromError";
  }
}

export class EmailSendError extends Error {
  constructor(reason: string) {
    super(`Resend refused to send the email: ${reason}`);
    this.name = "EmailSendError";
  }
}

export class EmailSendTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Resend did not respond within ${String(timeoutMs)}ms`);
    this.name = "EmailSendTimeoutError";
  }
}

// resend@6.26.0's emails.send takes no signal/timeout option (checked its own
// .d.ts: CreateEmailRequestOptions is just query/headers/idempotency-key), so
// a hung provider would otherwise run until the function's own maxDuration —
// racing a timer here turns that into a named, logged failure instead.
const SEND_TIMEOUT_MS = 10_000;

// Clears its own timer once the race settles either way, so a fast send
// never leaves a dangling timeout holding the function warm behind it.
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new EmailSendTimeoutError(ms));
    }, ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

export class ResendEmailSender implements EmailSender {
  private readonly apiKey: string;
  private readonly from: string;
  private readonly timeoutMs: number;

  constructor(env: AuthEnv = process.env, timeoutMs = SEND_TIMEOUT_MS) {
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
      throw new MissingResendApiKeyError();
    }
    const from = env.EMAIL_FROM;
    if (!from) {
      throw new MissingEmailFromError();
    }
    this.apiKey = apiKey;
    this.from = from;
    this.timeoutMs = timeoutMs;
  }

  async send(input: SendEmailInput): Promise<void> {
    const resend = new Resend(this.apiKey);
    const { error } = await withTimeout(
      resend.emails.send({
        from: this.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
      this.timeoutMs,
    );

    if (error) {
      throw new EmailSendError(error.message);
    }
  }
}
