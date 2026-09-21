import { Resend } from "resend";
import type { AuthEnv } from "../env";
import {
  EmailSendError,
  MissingEmailFromError,
  SEND_TIMEOUT_MS,
  withSendTimeout,
  type EmailSender,
  type SendEmailInput,
} from "./sender";

export class MissingResendApiKeyError extends Error {
  constructor() {
    super("RESEND_API_KEY is not set");
    this.name = "MissingResendApiKeyError";
  }
}

// resend@6.26.0's emails.send takes no signal/timeout option (checked its own
// .d.ts: CreateEmailRequestOptions is just query/headers/idempotency-key), so
// the shared timeout race is the only ceiling on a hung provider.
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
    const { error } = await withSendTimeout(
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
