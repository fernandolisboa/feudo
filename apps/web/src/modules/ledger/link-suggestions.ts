import {
  suggestLinks,
  type DismissedLinkPair,
  type LinkableTransaction,
  type TransactionLink,
} from "@feudo/core";

import type { HouseholdSession } from "@/modules/households";
import { householdScope } from "@/modules/households";
import { getDb } from "@/platform/db/client";

import { readUncategorizedWindow } from "./guided-categorization";
import type { ResolvedLedgerRow } from "./resolve-ledger-rows";
import { createTransactionLinkRepository } from "./transaction-link-repository";

function toLinkable(row: ResolvedLedgerRow): LinkableTransaction {
  return {
    id: row.id,
    accountId: row.accountId,
    date: row.date,
    occurredAt: row.occurredAt,
    amountCentavos: row.amountCentavos,
    currency: row.currency,
    type: row.type,
    subcategory: row.categorization?.subcategory ?? null,
    kind: row.kind,
    isInternalTransfer: row.internalTransfer !== null,
    isLinked: row.link !== null,
  };
}

export type LinkSuggestionCandidates = {
  rowById: ReadonlyMap<string, ResolvedLedgerRow>;
  suggestions: TransactionLink[];
};

// The one read behind both the Vínculos tab and every write that confirms
// or confirms-all a link: the same window and currency guided categorization
// reads (readUncategorizedWindow), mapped into packages/core's
// LinkableTransaction and run through the one pure suggestLinks function,
// alongside this household's own dismissals. A write that re-reads this
// right before confirming is re-validating the pair against the live
// suggestion list, never trusting what the client sent.
export async function computeLinkSuggestions(
  session: HouseholdSession,
  now: Date,
): Promise<LinkSuggestionCandidates> {
  const [{ rows }, dismissals]: [{ rows: ResolvedLedgerRow[] }, DismissedLinkPair[]] =
    await Promise.all([
      readUncategorizedWindow(session, now),
      createTransactionLinkRepository(householdScope(session)).listDismissals(getDb()),
    ]);
  const suggestions = suggestLinks(rows.map(toLinkable), dismissals);
  return { rowById: new Map(rows.map((row) => [row.id, row])), suggestions };
}
