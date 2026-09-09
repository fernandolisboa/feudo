import { escapeHtml } from "./escape-html";

export type EmailCopy = { subject: string; text: string; html: string };

export function renderEmail(copy: EmailCopy, replacements: Record<string, string>): EmailCopy {
  let text = copy.text;
  let html = copy.html;
  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = `{${key}}`;
    text = text.replaceAll(placeholder, value);
    html = html.replaceAll(placeholder, escapeHtml(value));
  }
  return { subject: copy.subject, text, html };
}
