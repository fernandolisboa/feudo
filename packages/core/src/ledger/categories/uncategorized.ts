import { NonIntegerAmountError } from "../../money/money";
import type { Categorization } from "./categorize";

export type CurrencyAmount = { amountCentavos: number; currency: string };

export type UncategorizedSummary = {
  count: number;
  totals: CurrencyAmount[];
};

// Synced transactions carry whatever currency the bank reported (a card bill
// in dollars, say), so totals are kept per currency rather than through
// Money, which is BRL-only; adding across currencies would be a wrong number.
function addSameCurrency(a: CurrencyAmount, b: CurrencyAmount): CurrencyAmount {
  const amountCentavos = a.amountCentavos + b.amountCentavos;
  if (!Number.isSafeInteger(amountCentavos)) {
    throw new NonIntegerAmountError(amountCentavos);
  }
  return { amountCentavos, currency: a.currency };
}

export function summarizeUncategorized(
  items: readonly { categorization: Categorization | null; amount: CurrencyAmount }[],
): UncategorizedSummary {
  const totalsByCurrency = new Map<string, CurrencyAmount>();
  let count = 0;

  for (const item of items) {
    if (item.categorization !== null) {
      continue;
    }
    count += 1;
    const absolute: CurrencyAmount = {
      amountCentavos: Math.abs(item.amount.amountCentavos),
      currency: item.amount.currency,
    };
    const running = totalsByCurrency.get(absolute.currency) ?? {
      amountCentavos: 0,
      currency: absolute.currency,
    };
    totalsByCurrency.set(absolute.currency, addSameCurrency(running, absolute));
  }

  const totals = [...totalsByCurrency.values()].sort((a, b) =>
    a.currency.localeCompare(b.currency),
  );
  return { count, totals };
}
