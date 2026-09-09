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

export class ResendEmailSender implements EmailSender {
  private readonly apiKey: string;
  private readonly from: string;

  constructor(env: AuthEnv = process.env) {
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
  }

  async send(input: SendEmailInput): Promise<void> {
    const resend = new Resend(this.apiKey);
    const { error } = await resend.emails.send({
      from: this.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    if (error) {
      throw new EmailSendError(error.message);
    }
  }
}
