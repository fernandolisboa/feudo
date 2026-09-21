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
// The shared race is only a backstop: nodemailer's own timeouts fire first,
// and its failure path is the one that closes the connection (close() on a
// non-pooled transport never touches an in-flight socket).
const BACKSTOP_MARGIN_MS = 1_000;
const portSchema = z.coerce.number().int().min(1).max(65535);

function readRequiredSetting(env: AuthEnv, variable: string): string {
  const value = env[variable]?.trim();
  if (!value) {
    throw new MissingSmtpSettingError(variable);
  }
  return value;
}

type TransportError = Error & { code?: unknown; responseCode?: unknown; command?: unknown };

// nodemailer appends the relay's raw response to its message, and relays echo
// the recipient address in RCPT TO rejections; Better Auth logs the whole
// error for the verification send, so the wrapped message carries only the
// structured fields, never the response text.
function describeTransportError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "unknown error";
  }
  const { code, responseCode, command } = error as TransportError;
  const parts = [code, responseCode, command].filter(
    (part): part is string | number => typeof part === "string" || typeof part === "number",
  );
  return parts.length > 0 ? parts.map(String).join(" ") : error.name;
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
    const from = env.EMAIL_FROM?.trim();
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
        this.timeoutMs + BACKSTOP_MARGIN_MS,
      );
    } catch (error) {
      if (error instanceof EmailSendTimeoutError) {
        throw error;
      }
      throw new EmailSendError(describeTransportError(error));
    } finally {
      transport.close();
    }
  }
}
