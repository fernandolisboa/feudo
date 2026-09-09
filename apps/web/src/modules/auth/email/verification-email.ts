import { t } from "../strings";
import { renderEmail, type EmailCopy } from "./render";

export type VerificationEmail = EmailCopy;

export function buildVerificationEmail(url: string): VerificationEmail {
  return renderEmail(t.verificationEmail, { url });
}
