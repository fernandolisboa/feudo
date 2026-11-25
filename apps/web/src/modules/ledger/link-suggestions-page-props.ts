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
// right next to it).
export async function getLinkSuggestionsProps(
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
