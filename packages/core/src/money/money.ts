export type Money = {
  amountCentavos: number;
  currency: "BRL";
};

export class NonIntegerAmountError extends Error {
  readonly amountCentavos: number;

  constructor(amountCentavos: number) {
    super(
      `Money amounts must be an integer number of centavos, received ${String(amountCentavos)}`,
    );
    this.name = "NonIntegerAmountError";
    this.amountCentavos = amountCentavos;
  }
}

export class NonFiniteAmountError extends Error {
  readonly amount: number;

  constructor(amount: number) {
    super(`Decimal amounts must be finite numbers, received ${String(amount)}`);
    this.name = "NonFiniteAmountError";
    this.amount = amount;
  }
}

function assertIntegerAmount(amountCentavos: number): void {
  if (!Number.isInteger(amountCentavos)) {
    throw new NonIntegerAmountError(amountCentavos);
  }
}

export function add(a: Money, b: Money): Money {
  assertIntegerAmount(a.amountCentavos);
  assertIntegerAmount(b.amountCentavos);
  return { amountCentavos: a.amountCentavos + b.amountCentavos, currency: "BRL" };
}

export function subtract(a: Money, b: Money): Money {
  assertIntegerAmount(a.amountCentavos);
  assertIntegerAmount(b.amountCentavos);
  return { amountCentavos: a.amountCentavos - b.amountCentavos, currency: "BRL" };
}

export function formatMoney(amount: { amountCentavos: number; currency: string }): string {
  assertIntegerAmount(amount.amountCentavos);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: amount.currency,
  }).format(amount.amountCentavos / 100);
}

export function formatBRL(money: Money): string {
  return formatMoney(money);
}

// Providers publish balances as decimal numbers in currency units (1234.56);
// rounding once here, at the boundary, keeps binary float noise such as
// 0.1 + 0.2 out of the integer centavos every calculation reads.
export function decimalToCentavos(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new NonFiniteAmountError(amount);
  }
  return Math.round(amount * 100);
}
