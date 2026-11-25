import { describe, expect, it } from "vitest";

import { aiBatchRowsFor, productSubcategoriesForPrompt } from "./ai-suggestion-candidates";

import type { ResolvedLedgerRow } from "./resolve-ledger-rows";

function row(overrides: Partial<ResolvedLedgerRow> = {}): ResolvedLedgerRow {
  return {
    id: "tx-1",
    date: "2026-09-10",
    occurredAt: null,
    description: "PIX RECEBIDO EMPRESA",
    amountCentavos: 5000,
    currency: "BRL",
    type: "credit",
    providerCategory: null,
    accountId: "acc-1",
    accountName: "Conta",
    institutionName: "Banco",
    accountType: "checking",
    counterpartDocumentHash: null,
    counterpartType: null,
    accountHolderDocumentHash: null,
    manual: null,
    transferMark: null,
    categorization: null,
    kind: null,
    internalTransfer: null,
    link: null,
    ...overrides,
  };
}

describe("productSubcategoriesForPrompt", () => {
  it("lists only Feudo's own subcategories, each with a non-empty label and a kind", () => {
    const subcategories = productSubcategoriesForPrompt();
    expect(subcategories.length).toBeGreaterThan(0);
    for (const subcategory of subcategories) {
      expect(subcategory.label.length).toBeGreaterThan(0);
      expect(subcategory.label).toContain(" · ");
      expect(["income", "fixed", "variable", "transfer"]).toContain(subcategory.kind);
    }
  });
});

describe("aiBatchRowsFor", () => {
  it("marks a transaction with no suggestion at all as eligible", () => {
    const rows = aiBatchRowsFor([row({ type: "debit", amountCentavos: -1000 })]);
    expect(rows[0]?.eligible).toBe(true);
  });

  it("marks a transaction whose only suggestion is the credit fallback as eligible", () => {
    const rows = aiBatchRowsFor([row({ type: "credit", amountCentavos: 5000 })]);
    expect(rows[0]?.eligible).toBe(true);
  });

  it("marks a transaction the household's own history already places as ineligible", () => {
    const history = row({
      id: "history",
      description: "PADARIA DO ZE",
      amountCentavos: -1000,
      type: "debit",
      categorization: {
        subcategory: { type: "product", id: "food.groceries" },
        source: "manual",
        ruleId: null,
      },
    });
    const pending = row({
      id: "pending",
      description: "PADARIA DO ZE",
      amountCentavos: -1000,
      type: "debit",
    });

    const rows = aiBatchRowsFor([history, pending]);

    expect(rows.find((r) => r.id === "pending")?.eligible).toBe(false);
  });

  it("returns rows in the queue's own order, largest amount first", () => {
    const small = row({ id: "small", amountCentavos: 500 });
    const big = row({ id: "big", amountCentavos: 90000 });

    const rows = aiBatchRowsFor([small, big]);

    expect(rows.map((r) => r.id)).toEqual(["big", "small"]);
  });
});
