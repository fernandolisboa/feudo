export type AmountInCurrency = { amountCentavos: number; currency: string };

// Installments of one purchase can differ by a few centavos, because the
// total rarely divides evenly. The absolute limit covers that rounding; the
// relative one keeps small amounts apart (R$ 5,00 and R$ 5,09 are two prices).
const SAME_AMOUNT_MAX_GAP_CENTAVOS = 10;
const SAME_AMOUNT_MAX_GAP_PERCENT_OF_LARGER = 1;

export function sameAmountGapCentavos(a: AmountInCurrency, b: AmountInCurrency): number | null {
  if (a.currency !== b.currency) return null;
  const first = Math.abs(a.amountCentavos);
  const second = Math.abs(b.amountCentavos);
  const gap = Math.abs(first - second);
  const withinTolerance =
    gap <= SAME_AMOUNT_MAX_GAP_CENTAVOS &&
    gap * 100 <= Math.max(first, second) * SAME_AMOUNT_MAX_GAP_PERCENT_OF_LARGER;
  return withinTolerance ? gap : null;
}

export function isSameAmount(a: AmountInCurrency, b: AmountInCurrency): boolean {
  return sameAmountGapCentavos(a, b) !== null;
}

// Exact beats near: once something has exactly the amount, anything a few
// centavos away is another payment, not a rounded installment of this one.
export function sameAmountGroup<T extends AmountInCurrency>(
  amount: AmountInCurrency,
  others: readonly T[],
): T[] {
  const exact = others.filter((other) => sameAmountGapCentavos(other, amount) === 0);
  return exact.length > 0 ? exact : others.filter((other) => isSameAmount(other, amount));
}
