import { t } from "../strings";
import { escapeHtml } from "./escape-html";

export type ResetPasswordEmail = { subject: string; text: string; html: string };

export function buildResetPasswordEmail(name: string, url: string): ResetPasswordEmail {
  const copy = t.resetPasswordEmail;
  return {
    subject: copy.subject,
    text: copy.text.replaceAll("{name}", name).replaceAll("{url}", url),
    html: copy.html.replaceAll("{name}", escapeHtml(name)).replaceAll("{url}", escapeHtml(url)),
  };
}
