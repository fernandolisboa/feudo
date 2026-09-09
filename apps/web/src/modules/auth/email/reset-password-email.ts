import { t } from "../strings";
import { renderEmail, type EmailCopy } from "./render";

export type ResetPasswordEmail = EmailCopy;

export function buildResetPasswordEmail(url: string, expiresIn: string): ResetPasswordEmail {
  return renderEmail(t.resetPasswordEmail, { url, expiresIn });
}
