export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface EmailSender {
  send(input: SendEmailInput): Promise<void>;
}

export class MissingEmailFromError extends Error {
  constructor() {
    super("EMAIL_FROM is not set");
    this.name = "MissingEmailFromError";
  }
}

export class EmailSendError extends Error {
  constructor(reason: string) {
    super(`The email provider refused to send the email: ${reason}`);
    this.name = "EmailSendError";
  }
}

export class EmailSendTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`The email provider did not respond within ${String(timeoutMs)}ms`);
    this.name = "EmailSendTimeoutError";
  }
}

// A hung provider would otherwise run until the function's own maxDuration;
// racing a timer turns that into a named, logged failure instead.
export const SEND_TIMEOUT_MS = 10_000;

// Clears its own timer once the race settles either way, so a fast send
// never leaves a dangling timeout holding the function warm behind it.
export async function withSendTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
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
