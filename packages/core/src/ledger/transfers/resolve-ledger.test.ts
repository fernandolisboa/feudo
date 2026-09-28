import { describe, expect, it } from "vitest";
import type { CategorizationRule } from "../categories/categorize";
import type { KindContext } from "../categories/kinds";
import { resolveLedger, type LedgerContext, type LedgerTransaction } from "./resolve-ledger";

function transaction(overrides: Partial<LedgerTransaction> = {}): LedgerTransaction {
  return {
    id: "t1",
    accountId: "checking-1",
    accountType: "checking",
    date: "2026-09-25",
    amountCentavos: 50000,
    currency: "BRL",
    type: "debit",
    counterpartDocumentHash: null,
    counterpartType: null,
    accountHolderDocumentHash: null,
    description: "COMPRA CARTAO MERCADO",
    providerCategory: null,
    manual: null,
    transferMark: null,
    ...overrides,
  };
}

function context(overrides: Partial<LedgerContext> = {}): LedgerContext {
  const kinds: KindContext = { overrides: new Map(), householdSubcategories: new Map() };
  return {
    rules: [],
    kinds,
    holderDocumentHashes: new Set(),
    ...overrides,
  };
}

function rule(overrides: Partial<CategorizationRule> = {}): CategorizationRule {
  return {
    id: "rule-1",
    pattern: "MERCADO",
    direction: null,
    subcategory: { type: "product", id: "food.groceries" },
    createdAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("resolveLedger precedence", () => {
  it("treats mark === true as an internal transfer regardless of the base categorization", () => {
    const [resolved] = resolveLedger(
      [transaction({ id: "t1", transferMark: true, providerCategory: "Groceries" })],
      context(),
    );
    expect(resolved).toEqual({
      id: "t1",
      categorization: {
        subcategory: { type: "product", id: "transfers.own-accounts" },
        source: "internal_transfer",
        ruleId: null,
      },
      kind: "transfer",
      internalTransfer: { source: "mark" },
    });
  });

  it("clears a transfer categorization when mark === false, leaving it uncategorized", () => {
    const [resolved] = resolveLedger(
      [
        transaction({
          id: "t1",
          description: "PAGAMENTO FATURA CARTAO",
          transferMark: false,
        }),
      ],
      context(),
    );
    expect(resolved).toEqual({
      id: "t1",
      categorization: null,
      kind: null,
      internalTransfer: null,
    });
  });

  it("keeps a non-transfer categorization intact when mark === false", () => {
    const [resolved] = resolveLedger(
      [
        transaction({
          id: "t1",
          description: "COMPRA CARTAO MERCADO",
          providerCategory: "Groceries",
          transferMark: false,
        }),
      ],
      context(),
    );
    expect(resolved).toEqual({
      id: "t1",
      categorization: {
        subcategory: { type: "product", id: "food.groceries" },
        source: "provider",
        ruleId: null,
      },
      kind: "variable",
      internalTransfer: null,
    });
  });

  it("excludes a manually categorized non-transfer transaction from pairing", () => {
    const manual = { type: "household" as const, id: "custom-1" };
    const householdSubcategories: KindContext["householdSubcategories"] = new Map([
      ["custom-1", { id: "custom-1", categoryId: "shopping", name: "Presentes", kind: "variable" }],
    ]);
    const debit = transaction({ id: "d1", accountId: "checking-1", type: "debit", manual });
    const credit = transaction({
      id: "c1",
      accountId: "card-1",
      accountType: "credit_card",
      type: "credit",
    });
    const [resolvedDebit, resolvedCredit] = resolveLedger(
      [debit, credit],
      context({ kinds: { overrides: new Map(), householdSubcategories } }),
    );
    expect(resolvedDebit).toEqual({
      id: "d1",
      categorization: { subcategory: manual, source: "manual", ruleId: null },
      kind: "variable",
      internalTransfer: null,
    });
    expect(resolvedCredit?.internalTransfer).toBeNull();
  });

  it("keeps a manual transfer categorization when the transaction gets paired", () => {
    const manual = { type: "product" as const, id: "investments.movements" as const };
    const debit = transaction({ id: "d1", accountId: "checking-1", type: "debit", manual });
    const credit = transaction({
      id: "c1",
      accountId: "investment-1",
      accountType: "investment",
      type: "credit",
    });
    const [resolvedDebit] = resolveLedger([debit, credit], context());
    expect(resolvedDebit).toEqual({
      id: "d1",
      categorization: { subcategory: manual, source: "manual", ruleId: null },
      kind: "transfer",
      internalTransfer: { source: "pair", counterpartId: "c1", confirmed: false },
    });
  });

  it("forces kind transfer for a detected pair even when the household overrides transfers.own-accounts", () => {
    const kinds: KindContext = {
      overrides: new Map([["transfers.own-accounts", "fixed"]]),
      householdSubcategories: new Map(),
    };
    const debit = transaction({ id: "d1", accountId: "checking-1", type: "debit" });
    const credit = transaction({ id: "c1", accountId: "checking-2", type: "credit" });
    const [resolvedDebit] = resolveLedger([debit, credit], context({ kinds }));
    expect(resolvedDebit?.kind).toBe("transfer");
    expect(resolvedDebit?.categorization).toEqual({
      subcategory: { type: "product", id: "transfers.own-accounts" },
      source: "internal_transfer",
      ruleId: null,
    });
  });

  it("pairs a card-bill payment with the card's credit and categorizes both as transfers.card-bill", () => {
    const debit = transaction({
      id: "d1",
      accountId: "checking-1",
      accountType: "checking",
      type: "debit",
      description: "PAGAMENTO FATURA CARTAO",
    });
    const credit = transaction({
      id: "c1",
      accountId: "card-1",
      accountType: "credit_card",
      type: "credit",
      description: "PAGAMENTO RECEBIDO",
    });
    const [resolvedDebit, resolvedCredit] = resolveLedger([debit, credit], context());

    expect(resolvedDebit).toEqual({
      id: "d1",
      categorization: {
        subcategory: { type: "product", id: "transfers.card-bill" },
        source: "default",
        ruleId: null,
      },
      kind: "transfer",
      internalTransfer: { source: "pair", counterpartId: "c1", confirmed: false },
    });
    expect(resolvedCredit).toEqual({
      id: "c1",
      categorization: {
        subcategory: { type: "product", id: "transfers.card-bill" },
        source: "internal_transfer",
        ruleId: null,
      },
      kind: "transfer",
      internalTransfer: { source: "pair", counterpartId: "d1", confirmed: false },
    });
  });

  it("categorizes an unpaired, unmarked transaction as usual", () => {
    const [resolved] = resolveLedger(
      [
        transaction({
          id: "t1",
          description: "PIX ENVIADO CONDOMINIO RESIDENCIAL",
          providerCategory: "Transfers",
        }),
      ],
      context({
        rules: [
          rule({ pattern: "CONDOMINIO", subcategory: { type: "product", id: "housing.condo" } }),
        ],
      }),
    );
    expect(resolved).toEqual({
      id: "t1",
      categorization: {
        subcategory: { type: "product", id: "housing.condo" },
        source: "rule",
        ruleId: "rule-1",
      },
      kind: "fixed",
      internalTransfer: null,
    });
  });

  it("uses the paired counterpart's account type for a mark on an account that is not itself a card", () => {
    const marked = transaction({
      id: "d1",
      accountId: "checking-1",
      accountType: "checking",
      type: "debit",
      transferMark: true,
    });
    const cardCredit = transaction({
      id: "c1",
      accountId: "card-1",
      accountType: "credit_card",
      type: "credit",
    });
    const [resolvedMarked] = resolveLedger([marked, cardCredit], context());
    expect(resolvedMarked?.categorization).toEqual({
      subcategory: { type: "product", id: "transfers.card-bill" },
      source: "internal_transfer",
      ruleId: null,
    });
  });

  it("preserves order and length of the input", () => {
    const transactions = [
      transaction({ id: "a" }),
      transaction({ id: "b", type: "credit" }),
      transaction({ id: "c" }),
    ];
    const resolved = resolveLedger(transactions, context());
    expect(resolved.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });
});
