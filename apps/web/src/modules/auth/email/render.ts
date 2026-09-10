import { escapeHtml } from "./escape-html";

export type EmailCopy = { subject: string; text: string; html: string };

export function renderEmail(copy: EmailCopy, replacements: Record<string, string>): EmailCopy {
  let subject = copy.subject;
  let text = copy.text;
  let html = copy.html;
  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = `{${key}}`;
    subject = subject.replaceAll(placeholder, value);
    text = text.replaceAll(placeholder, value);
    html = html.replaceAll(placeholder, escapeHtml(value));
  }
  return { subject, text, html };
}
