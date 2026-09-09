import { t } from "../strings";
import { escapeHtml } from "./escape-html";

export type MagicLinkEmail = { subject: string; text: string; html: string };

export function buildMagicLinkEmail(url: string): MagicLinkEmail {
  const copy = t.magicLinkEmail;
  return {
    subject: copy.subject,
    text: copy.text.replaceAll("{url}", url),
    html: copy.html.replaceAll("{url}", escapeHtml(url)),
  };
}
