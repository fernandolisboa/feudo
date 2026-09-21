import { createTransport } from "nodemailer";
import { z } from "zod";
import type { AuthEnv } from "../env";
import {
  EmailSendError,
  EmailSendTimeoutError,
  MissingEmailFromError,
  SEND_TIMEOUT_MS,
  withSendTimeout,
  type EmailSender,
  type SendEmailInput,
} from "./sender";

export class MissingSmtpSettingError extends Error {
  readonly variable: string;

  constructor(variable: string) {
    super(`${variable} is not set`);
    this.name = "MissingSmtpSettingError";
    this.variable = variable;
  }
}

export class InvalidSmtpPortError extends Error {
  constructor(value: string) {
    super(`SMTP_PORT has an invalid value: ${value}`);
    this.name = "InvalidSmtpPortError";
  }
}

const IMPLICIT_TLS_PORT = 465;
const portSchema = z.coerce.number().int().min(1).max(65535);

function readRequiredSetting(env: AuthEnv, variable: string): string {
  const value = env[variable];
  if (!value) {
    throw new MissingSmtpSettingError(variable);
  }
  return value;
}

function readPort(env: AuthEnv): number {
  const raw = env.SMTP_PORT;
  if (!raw) {
    return IMPLICIT_TLS_PORT;
  }
  const parsed = portSchema.safeParse(raw);
  if (!parsed.success) {
    throw new InvalidSmtpPortError(raw);
  }
  return parsed.data;
}

export class SmtpEmailSender implements EmailSender {
  private readonly host: string;
  private readonly port: number;
  private readonly user: string;
  private readonly password: string;
  private readonly from: string;
  private readonly timeoutMs: number;

  constructor(env: AuthEnv = process.env, timeoutMs = SEND_TIMEOUT_MS) {
    this.host = readRequiredSetting(env, "SMTP_HOST");
    this.port = readPort(env);
    this.user = readRequiredSetting(env, "SMTP_USER");
    this.password = readRequiredSetting(env, "SMTP_PASSWORD");
    const from = env.EMAIL_FROM;
    if (!from) {
      throw new MissingEmailFromError();
    }
    this.from = from;
    this.timeoutMs = timeoutMs;
  }

  async send(input: SendEmailInput): Promise<void> {
    const implicitTls = this.port === IMPLICIT_TLS_PORT;
    // Credentials never travel in clear: 465 is TLS from the first byte, any
    // other port must upgrade with STARTTLS before AUTH or the send fails.
    const transport = createTransport({
      host: this.host,
      port: this.port,
      secure: implicitTls,
      requireTLS: !implicitTls,
      auth: { user: this.user, pass: this.password },
      connectionTimeout: this.timeoutMs,
      greetingTimeout: this.timeoutMs,
      socketTimeout: this.timeoutMs,
    });
    try {
      await withSendTimeout(
        transport.sendMail({
          from: this.from,
          to: input.to,
          subject: input.subject,
          text: input.text,
          html: input.html,
        }),
        this.timeoutMs,
      );
    } catch (error) {
      if (error instanceof EmailSendTimeoutError) {
        throw error;
      }
      throw new EmailSendError(error instanceof Error ? error.message : "unknown error");
    } finally {
      transport.close();
    }
  }
}
