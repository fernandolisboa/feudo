import type { TransactionLinkKind } from "@feudo/core";

import type { SimpleOutcome } from "@/lib/outcome";
import type { HouseholdSession } from "@/modules/households";
import { householdScope } from "@/modules/households";
import type { Database } from "@/platform/db/client";

import { computeLinkSuggestions } from "./link-suggestions";
import { createTransactionLinkRepository } from "./transaction-link-repository";
import type { LinkPairFormInput } from "./validation";

export type LinkOutcome = SimpleOutcome<"ok" | "not_found" | "failed">;

// Re-derives the suggestion list right before writing (link-suggestions.ts,
// the same read that built the Vínculos tab) instead of trusting the pair
// the form posted: a pair that no longer appears in a fresh suggestion
// (already linked, an account that left the household, a dismissed pair, a
// crafted pair with the wrong shape) refuses with "not_found" before the
// repository's own re-check inside the write even runs.
export async function confirmLink(
  input: LinkPairFormInput,
  session: HouseholdSession,
  db: Database,
  now: Date = new Date(),
): Promise<LinkOutcome> {
  try {
    const { suggestions } = await computeLinkSuggestions(session, now);
    const match = suggestions.find(
      (suggestion) =>
        suggestion.debitTransactionId === input.debitTransactionId &&
        suggestion.creditTransactionId === input.creditTransactionId,
    );
    if (!match) {
      return { status: "not_found" };
    }
    const status = await createTransactionLinkRepository(householdScope(session)).confirm(
      db,
      match,
      session.userId,
    );
    return { status };
  } catch {
    return { status: "failed" };
  }
}

// Still an explicit member action (one press per kind, never silent): every
// pair of that kind in the live suggestion list is confirmed, each through
// the same repository re-check as a single confirm. "ok" once at least one
// pair lands; a kind with nothing left to confirm (the list moved under the
// member, or they double-pressed) refuses with "not_found" rather than
// silently doing nothing.
export async function confirmAllLinks(
  kind: TransactionLinkKind,
  session: HouseholdSession,
  db: Database,
  now: Date = new Date(),
): Promise<LinkOutcome> {
  try {
    const { suggestions } = await computeLinkSuggestions(session, now);
    const matching = suggestions.filter((suggestion) => suggestion.kind === kind);
    if (matching.length === 0) {
      return { status: "not_found" };
    }
    const repository = createTransactionLinkRepository(householdScope(session));
    let confirmedAny = false;
    for (const suggestion of matching) {
      const status = await repository.confirm(db, suggestion, session.userId);
      confirmedAny ||= status === "ok";
    }
    return { status: confirmedAny ? "ok" : "not_found" };
  } catch {
    return { status: "failed" };
  }
}

export async function dismissLink(
  input: LinkPairFormInput,
  session: HouseholdSession,
  db: Database,
): Promise<LinkOutcome> {
  try {
    const status = await createTransactionLinkRepository(householdScope(session)).dismiss(
      db,
      input.debitTransactionId,
      input.creditTransactionId,
    );
    return { status };
  } catch {
    return { status: "failed" };
  }
}

export async function undoLink(
  transactionId: string,
  session: HouseholdSession,
  db: Database,
): Promise<LinkOutcome> {
  try {
    const status = await createTransactionLinkRepository(householdScope(session)).undo(
      db,
      transactionId,
    );
    return { status };
  } catch {
    return { status: "failed" };
  }
}
