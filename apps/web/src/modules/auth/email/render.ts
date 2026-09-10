import { escapeHtml } from "./escape-html";

export type EmailCopy = { subject: string; text: string; html: string };

export function renderEmail(copy: EmailCopy, replacements: Record<string, string>): EmailCopy {
  let subject = copy.subject;
  let text = copy.text;
  let html = copy.html;
  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = `{${key}}`;
    const escapedValue = escapeHtml(value);
    // A function replacer, not a string one: String.prototype.replaceAll
    // treats a string replacement's $&, $', $` and $$ as special patterns
    // even when the search value is a plain string, so a household or
    // inviter name containing one of those would otherwise corrupt the
    // email around it instead of being inserted literally.
    subject = subject.replaceAll(placeholder, () => value);
    text = text.replaceAll(placeholder, () => value);
    html = html.replaceAll(placeholder, () => escapedValue);
  }
  return { subject, text, html };
}
