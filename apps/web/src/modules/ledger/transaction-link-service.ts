import type { TransactionLink } from "@feudo/core";

import type { SimpleOutcome, Outcome } from "@/lib/outcome";
import type { HouseholdSession } from "@/modules/households";
import { householdScope } from "@/modules/households";
import type { Database } from "@/platform/db/client";

import { computeLinkSuggestions } from "./link-suggestions";
import { createTransactionLinkRepository } from "./transaction-link-repository";
import type {
  ConfirmAllLinksFormInput,
  ConfirmLinkFormInput,
  LinkPairFormInput,
} from "./validation";

export type LinkOutcome = SimpleOutcome<"ok" | "not_found" | "failed">;

export type ConfirmAllLinksOutcome = Outcome<
  { confirmedCount: number; requestedCount: number },
  "not_found" | "failed"
>;

function pairKey(pair: { debitTransactionId: string; creditTransactionId: string }): string {
  return `${pair.debitTransactionId}:${pair.creditTransactionId}`;
}

// Re-derives the suggestion list right before writing (link-suggestions.ts,
// the same read that built the Vínculos tab) instead of trusting the pair
// the form posted: a pair that no longer appears in a fresh suggestion with
// exactly the expected kind (already linked, an account that left the
// household, a dismissed pair, the kind having moved since the page
// rendered, a crafted pair with the wrong shape) refuses with "not_found"
// before the repository's own re-check inside the write even runs. The kind
// persisted is always the one found in the live list, never the one the
// form posted.
export async function confirmLink(
  input: ConfirmLinkFormInput,
  session: HouseholdSession,
  db: Database,
  now: Date = new Date(),
): Promise<LinkOutcome> {
  try {
    const { suggestions } = await computeLinkSuggestions(session, now);
    const match = suggestions.find(
      (suggestion) =>
        suggestion.debitTransactionId === input.debitTransactionId &&
        suggestion.creditTransactionId === input.creditTransactionId &&
        suggestion.kind === input.kind,
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

// Still an explicit member action (one press per kind, never silent): only
// the pairs the member actually saw (the displayed pair ids the form
// posted) are confirmed, each intersected against the live suggestion list
// for that kind first, so a pair that arrived after the member looked never
// rides along. Each surviving pair goes through the same repository
// re-check as a single confirm. "ok" once at least one lands; nothing left
// to confirm (the list moved under the member, or they double-pressed)
// refuses with "not_found" rather than silently doing nothing.
export async function confirmAllLinks(
  input: ConfirmAllLinksFormInput,
  session: HouseholdSession,
  db: Database,
  now: Date = new Date(),
): Promise<ConfirmAllLinksOutcome> {
  try {
    const { suggestions } = await computeLinkSuggestions(session, now);
    const live = new Map<string, TransactionLink>(
      suggestions
        .filter((suggestion) => suggestion.kind === input.kind)
        .map((suggestion) => [pairKey(suggestion), suggestion]),
    );
    const matching = input.pairs.flatMap((pair) => {
      const suggestion = live.get(pairKey(pair));
      return suggestion ? [suggestion] : [];
    });
    if (matching.length === 0) {
      return { status: "not_found" };
    }
    const repository = createTransactionLinkRepository(householdScope(session));
    let confirmedCount = 0;
    for (const suggestion of matching) {
      const status = await repository.confirm(db, suggestion, session.userId);
      if (status === "ok") confirmedCount += 1;
    }
    if (confirmedCount === 0) {
      return { status: "not_found" };
    }
    return { status: "ok", confirmedCount, requestedCount: input.pairs.length };
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
