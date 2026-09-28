import type { Kind, TransactionDirection } from "./categories/taxonomy";
import { addSameCurrency, type CurrencyAmount } from "./categories/uncategorized";

export type LedgerTotals = {
  income: CurrencyAmount[];
  spending: CurrencyAmount[];
  transferCount: number;
};

type LedgerLineItem = { kind: Kind | null; type: TransactionDirection; amount: CurrencyAmount };

function accumulateByCurrency(
  items: readonly LedgerLineItem[],
  matchesKind: (kind: Kind) => boolean,
  positiveDirection: TransactionDirection,
): CurrencyAmount[] {
  const totalsByCurrency = new Map<string, CurrencyAmount>();

  for (const item of items) {
    if (item.kind === null || !matchesKind(item.kind)) continue;

    const magnitude = Math.abs(item.amount.amountCentavos);
    const signedAmount: CurrencyAmount = {
      amountCentavos: item.type === positiveDirection ? magnitude : -magnitude,
      currency: item.amount.currency,
    };
    const running = totalsByCurrency.get(item.amount.currency) ?? {
      amountCentavos: 0,
      currency: item.amount.currency,
    };
    totalsByCurrency.set(item.amount.currency, addSameCurrency(running, signedAmount));
  }

  return [...totalsByCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

export function summarizeLedger(items: readonly LedgerLineItem[]): LedgerTotals {
  const income = accumulateByCurrency(items, (kind) => kind === "income", "credit");
  const spending = accumulateByCurrency(
    items,
    (kind) => kind === "fixed" || kind === "variable",
    "debit",
  );
  const transferCount = items.filter((item) => item.kind === "transfer").length;
  return { income, spending, transferCount };
}
