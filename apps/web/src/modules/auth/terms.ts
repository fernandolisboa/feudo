import { and, eq, ne } from "drizzle-orm";

import { user } from "./schema";

import type { DatabaseOrTransaction } from "@/platform/db/client";
import type { CurrentSession } from "./session";

// One version covers both documents: they are accepted together, at sign-up
// and again whenever either changes (ADR-0008).
export const TERMS_VERSION = "2026-10-05";

export const TERMS_ROUTE = "/termos";
export const PRIVACY_POLICY_ROUTE = "/privacidade";
export const TERMS_ACCEPTANCE_ROUTE = "/aceitar-termos";

export function hasAcceptedCurrentTerms(session: Pick<CurrentSession, "termsVersion">): boolean {
  return session.termsVersion === TERMS_VERSION;
}

// The version is never read from the client: a session can only ever record
// the version this deploy publishes, at the moment it accepts it.
export async function recordCurrentTermsAcceptance(
  db: DatabaseOrTransaction,
  session: Pick<CurrentSession, "userId">,
  now: Date,
): Promise<void> {
  await db
    .update(user)
    .set({ termsVersion: TERMS_VERSION, termsAcceptedAt: now })
    .where(and(eq(user.id, session.userId), ne(user.termsVersion, TERMS_VERSION)));
}
