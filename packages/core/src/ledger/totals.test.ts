import { describe, expect, it } from "vitest";
import type { Kind, TransactionDirection } from "./categories/taxonomy";
import type { CurrencyAmount } from "./categories/uncategorized";
import { summarizeLedger, type LedgerTotals } from "./totals";

type Item = { kind: Kind | null; type: TransactionDirection; amount: CurrencyAmount };

function item(overrides: Partial<Item> = {}): Item {
  return {
    kind: "income",
    type: "credit",
    amount: { amountCentavos: 10000, currency: "BRL" },
    ...overrides,
  };
}

function amount(amountCentavos: number, currency = "BRL"): CurrencyAmount {
  return { amountCentavos, currency };
}

describe("summarizeLedger", () => {
  it("adds an income credit and subtracts an income debit (refund)", () => {
    const result = summarizeLedger([
      item({ kind: "income", type: "credit", amount: amount(10000) }),
      item({ kind: "income", type: "debit", amount: amount(3000) }),
    ]);
    expect(result.income).toEqual([amount(7000)]);
  });

  it("adds a fixed or variable debit and subtracts a credit refund from spending", () => {
    const result = summarizeLedger([
      item({ kind: "fixed", type: "debit", amount: amount(20000) }),
      item({ kind: "variable", type: "debit", amount: amount(5000) }),
      item({ kind: "variable", type: "credit", amount: amount(2000) }),
    ]);
    expect(result.spending).toEqual([amount(23000)]);
  });

  it("excludes internal transfers and uncategorized items from every total", () => {
    const result = summarizeLedger([
      item({ kind: "transfer", type: "debit", amount: amount(50000) }),
      item({ kind: null, type: "debit", amount: amount(9000) }),
    ]);
    expect(result.income).toEqual([]);
    expect(result.spending).toEqual([]);
  });

  it("reports how many transactions are internal transfers", () => {
    const result = summarizeLedger([
      item({ kind: "transfer", type: "debit" }),
      item({ kind: "transfer", type: "credit" }),
      item({ kind: "income", type: "credit" }),
    ]);
    expect(result.transferCount).toBe(2);
  });

  it("keeps income and spending per currency, sorted, without mixing currencies", () => {
    const result = summarizeLedger([
      item({ kind: "income", type: "credit", amount: amount(10000, "BRL") }),
      item({ kind: "income", type: "credit", amount: amount(500, "USD") }),
      item({ kind: "fixed", type: "debit", amount: amount(4000, "EUR") }),
      item({ kind: "fixed", type: "debit", amount: amount(1000, "BRL") }),
    ]);
    expect(result.income).toEqual([amount(10000, "BRL"), amount(500, "USD")]);
    expect(result.spending).toEqual([amount(1000, "BRL"), amount(4000, "EUR")]);
  });

  it("keeps a currency in the total even when its net amount is zero", () => {
    const result = summarizeLedger([
      item({ kind: "fixed", type: "debit", amount: amount(5000) }),
      item({ kind: "fixed", type: "credit", amount: amount(5000) }),
    ]);
    expect(result.spending).toEqual([amount(0)]);
  });

  it("returns an empty totals object for no items", () => {
    const result: LedgerTotals = summarizeLedger([]);
    expect(result).toEqual({ income: [], spending: [], transferCount: 0 });
  });
});
