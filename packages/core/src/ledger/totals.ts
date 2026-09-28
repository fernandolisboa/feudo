import type { Kind, TransactionDirection } from "./categories/taxonomy";
import type { CurrencyAmount } from "./categories/uncategorized";

export type LedgerTotals = {
  income: CurrencyAmount[];
  spending: CurrencyAmount[];
  transferCount: number;
};

// The one definition of "net amount of a kind" (ADR-0003: income credits add
// and debits subtract, spending's fixed and variable kinds do the reverse):
// summarizeLedger (multi-currency, per household) and buildLedgerDashboard
// (already narrowed to one currency) both read this instead of keeping their
// own copy of the sign rule.
export type NetLineItem = {
  kind: Kind | null;
  type: TransactionDirection;
  amountCentavos: number;
};

export function netForKind(
  items: readonly NetLineItem[],
  kind: Kind,
  positiveDirection: TransactionDirection,
): number {
  let total = 0;
  for (const item of items) {
    if (item.kind !== kind) continue;
    const magnitude = Math.abs(item.amountCentavos);
    total += item.type === positiveDirection ? magnitude : -magnitude;
  }
  return total;
}

type LedgerLineItem = { kind: Kind | null; type: TransactionDirection; amount: CurrencyAmount };

function currenciesForKinds(items: readonly LedgerLineItem[], kinds: readonly Kind[]): string[] {
  const currencies = new Set<string>();
  for (const item of items) {
    if (item.kind !== null && kinds.includes(item.kind)) {
      currencies.add(item.amount.currency);
    }
  }
  return [...currencies].sort((a, b) => a.localeCompare(b));
}

function accumulateByCurrency(
  items: readonly LedgerLineItem[],
  kinds: readonly Kind[],
  positiveDirection: TransactionDirection,
): CurrencyAmount[] {
  return currenciesForKinds(items, kinds).map((currency) => {
    const itemsInCurrency: NetLineItem[] = items
      .filter((item) => item.amount.currency === currency)
      .map((item) => ({
        kind: item.kind,
        type: item.type,
        amountCentavos: item.amount.amountCentavos,
      }));
    const amountCentavos = kinds.reduce(
      (total, kind) => total + netForKind(itemsInCurrency, kind, positiveDirection),
      0,
    );
    return { amountCentavos, currency };
  });
}

export function summarizeLedger(items: readonly LedgerLineItem[]): LedgerTotals {
  const income = accumulateByCurrency(items, ["income"], "credit");
  const spending = accumulateByCurrency(items, ["fixed", "variable"], "debit");
  const transferCount = items.filter((item) => item.kind === "transfer").length;
  return { income, spending, transferCount };
}
