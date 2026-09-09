import { readEmailProvider } from "../env";
import { fakeEmailSender } from "./fake-sender";
import { ResendEmailSender } from "./resend-sender";
import type { EmailSender } from "./sender";

export function getEmailSender(env: NodeJS.ProcessEnv = process.env): EmailSender {
  const provider = readEmailProvider(env);
  return provider === "fake" ? fakeEmailSender : new ResendEmailSender();
}
