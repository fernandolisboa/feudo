import { formatMoney } from "@feudo/core";

// What a rule could be bound to; null for a transaction of zero, which has
// no amount to bind to (categorization_rule only accepts a positive one).
export function ruleAmountLabel(row: { amountCentavos: number; currency: string }): string | null {
  return row.amountCentavos === 0
    ? null
    : formatMoney({ amountCentavos: Math.abs(row.amountCentavos), currency: row.currency });
}
