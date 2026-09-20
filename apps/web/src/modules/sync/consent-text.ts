import { t } from "./strings";

export const CONSENT_SCOPE_VERSION = "2026-09-19";

// Stored verbatim on the consent row so what the user saw can be reproduced
// (ADR-0008), whatever the copy says by then.
export function currentConsentScopeText(): string {
  return t.consent.paragraphs.join("\n\n");
}

// A consent older than this cannot back a new connection: the wizard runs in
// one sitting, and an accepted-but-abandoned step must not authorize a
// connection days later. Orphan rows past this age are pruned daily.
export const CONSENT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
