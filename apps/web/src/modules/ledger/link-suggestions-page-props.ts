import { cache } from "react";

import { formatMoney, type TransactionLinkKind } from "@feudo/core";

import { recordFinancialDataAccess } from "@/modules/audit";
import { formatIsoDate } from "@/lib/format-date";
import type { HouseholdSession } from "@/modules/households";

import { computeLinkSuggestions } from "./link-suggestions";
import { t } from "./strings";

export type LinkSuggestionRow = {
  debitTransactionId: string;
  creditTransactionId: string;
  kind: TransactionLinkKind;
  dateLabel: string;
  amountLabel: string;
  accountLabel: string;
  debitDescription: string;
  creditDescription: string;
  kindLabel: string;
};

export type LinkSuggestionsProps = {
  items: LinkSuggestionRow[];
  pendingCount: number;
};

// Everything the Vínculos tab renders: computeLinkSuggestions' same window
// and currency as guided categorization, turned into display rows. The
// audit write (ADR-0008) happens only after the read succeeds, the same
// order as every other reader of financial data (getGuidedCategorizationProps
// right next to it). Wrapped in React's cache() (same pattern as
// auth/session.ts's getCurrentSession) so the tab label's pending count and
// the Vínculos tab's own content, called with the same `now`, share one
// read per request; outside a request (and this module's own tests)
// cache() is a no-op and every call runs fresh.
async function getLinkSuggestionsPropsUncached(
  session: HouseholdSession,
  now: Date = new Date(),
): Promise<LinkSuggestionsProps> {
  const { rowById, suggestions } = await computeLinkSuggestions(session, now);

  const items: LinkSuggestionRow[] = suggestions.flatMap((link): LinkSuggestionRow[] => {
    const debit = rowById.get(link.debitTransactionId);
    const credit = rowById.get(link.creditTransactionId);
    if (!debit || !credit) {
      return [];
    }
    return [
      {
        debitTransactionId: link.debitTransactionId,
        creditTransactionId: link.creditTransactionId,
        kind: link.kind,
        dateLabel: formatIsoDate(debit.date),
        amountLabel: formatMoney({
          amountCentavos: Math.abs(debit.amountCentavos),
          currency: debit.currency,
        }),
        accountLabel: `${debit.institutionName} · ${debit.accountName}`,
        debitDescription: debit.description,
        creditDescription: credit.description,
        kindLabel: t.links.kind[link.kind],
      },
    ];
  });

  await recordFinancialDataAccess(session, "transactions");
  return { items, pendingCount: items.length };
}

export const getLinkSuggestionsProps = cache(getLinkSuggestionsPropsUncached);

// The thin accessor /categorizar's page uses for the Vínculos tab label, so
// the page never reaches into the larger props bag just to read one count.
// Reads the same cache()-wrapped promise the Vínculos tab's own content
// awaits inside its error boundary, so a failure the member will see there
// anyway never also takes the tab label, and the rest of the page, down with
// it: null stands for "could not count them," never for zero.
export async function getLinkSuggestionsPendingCount(
  session: HouseholdSession,
  now: Date = new Date(),
): Promise<number | null> {
  try {
    const { pendingCount } = await getLinkSuggestionsProps(session, now);
    return pendingCount;
  } catch {
    return null;
  }
}
