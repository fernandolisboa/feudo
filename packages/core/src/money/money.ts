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

export function formatBRL(money: Money): string {
  assertIntegerAmount(money.amountCentavos);
  const isNegative = money.amountCentavos < 0;
  const absoluteCentavos = Math.abs(money.amountCentavos);
  const reais = Math.floor(absoluteCentavos / 100);
  const centavos = absoluteCentavos % 100;
  const reaisWithSeparators = reais.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const centavosPadded = centavos.toString().padStart(2, "0");
  const sign = isNegative ? "-" : "";
  return `${sign}R$ ${reaisWithSeparators},${centavosPadded}`;
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
