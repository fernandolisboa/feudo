import { t } from "../strings";
import { renderEmail, type EmailCopy } from "./render";

export type MagicLinkEmail = EmailCopy;

export function buildMagicLinkEmail(url: string, expiresIn: string): MagicLinkEmail {
  return renderEmail(t.magicLinkEmail, { url, expiresIn });
}
