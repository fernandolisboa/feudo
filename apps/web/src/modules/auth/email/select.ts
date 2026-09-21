import type { AuthEnv } from "../env";
import { readEmailProvider } from "../env";
import { fakeEmailSender } from "./fake-sender";
import { ResendEmailSender } from "./resend-sender";
import type { EmailSender } from "./sender";
import { SmtpEmailSender } from "./smtp-sender";

export function getEmailSender(env: AuthEnv = process.env): EmailSender {
  const provider = readEmailProvider(env);
  switch (provider) {
    case "fake":
      return fakeEmailSender;
    case "resend":
      return new ResendEmailSender(env);
    case "smtp":
      return new SmtpEmailSender(env);
  }
}
