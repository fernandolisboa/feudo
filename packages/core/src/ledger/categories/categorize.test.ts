import { describe, expect, it } from "vitest";
import {
  categorize,
  orderRules,
  type CategorizableTransaction,
  type CategorizationRule,
} from "./categorize";
import { normalizeDescription } from "./description";

function transaction(overrides: Partial<CategorizableTransaction> = {}): CategorizableTransaction {
  return {
    description: "COMPRA CARTAO MERCADO",
    type: "debit",
    providerCategory: null,
    manual: null,
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

describe("categorize precedence", () => {
  it("prefers a manual categorization over everything else", () => {
    const result = categorize(
      transaction({
        manual: { type: "product", id: "leisure.outings" },
        providerCategory: "Groceries",
      }),
      [rule()],
    );
    expect(result).toEqual({
      subcategory: { type: "product", id: "leisure.outings" },
      source: "manual",
      ruleId: null,
    });
  });

  it("prefers a household rule over a product default and the provider mapping", () => {
    const result = categorize(
      transaction({ description: "PIX ENVIADO CONDOMINIO RESIDENCIAL", providerCategory: "Rent" }),
      orderRules([
        rule({
          id: "condo-rule",
          pattern: "CONDOMINIO RESIDENCIAL",
          subcategory: { type: "household", id: "custom-condo" },
        }),
      ]),
    );
    expect(result).toEqual({
      subcategory: { type: "household", id: "custom-condo" },
      source: "rule",
      ruleId: "condo-rule",
    });
  });

  it("prefers a product default rule over the provider mapping", () => {
    const result = categorize(
      transaction({ description: "PAGAMENTO FATURA CARTAO", providerCategory: "Other" }),
      [],
    );
    expect(result).toEqual({
      subcategory: { type: "product", id: "transfers.card-bill" },
      source: "default",
      ruleId: null,
    });
  });

  it("falls back to the provider category mapping when nothing else matches", () => {
    const result = categorize(
      transaction({ description: "COMPRA CARTAO MERCADO", providerCategory: "Groceries" }),
      [],
    );
    expect(result).toEqual({
      subcategory: { type: "product", id: "food.groceries" },
      source: "provider",
      ruleId: null,
    });
  });

  it("returns null when nothing matches", () => {
    const result = categorize(
      transaction({ description: "UNKNOWN THING", providerCategory: "Unknown Category" }),
      [],
    );
    expect(result).toBeNull();
  });

  it("returns null for an unknown provider category with no rule match", () => {
    const result = categorize(
      transaction({
        description: "MYSTERY PAYMENT",
        providerCategory: "Some Unrecognized Category",
      }),
      [],
    );
    expect(result).toBeNull();
  });
});

describe("categorize direction filters", () => {
  it("ignores a household rule scoped to the opposite direction", () => {
    const result = categorize(
      transaction({ description: "RENDIMENTO POUPANCA", type: "debit" }),
      orderRules([
        rule({
          pattern: "RENDIMENTO POUPANCA",
          direction: "credit",
          subcategory: { type: "product", id: "income.yields" },
        }),
      ]),
    );
    expect(result?.source).not.toBe("rule");
  });

  it("applies a household rule scoped to the matching direction", () => {
    const result = categorize(
      transaction({ description: "RENDIMENTO POUPANCA", type: "credit" }),
      orderRules([
        rule({
          pattern: "RENDIMENTO POUPANCA",
          direction: "credit",
          subcategory: { type: "product", id: "income.yields" },
        }),
      ]),
    );
    expect(result).toEqual({
      subcategory: { type: "product", id: "income.yields" },
      source: "rule",
      ruleId: "rule-1",
    });
  });

  it("applies a direction-agnostic default rule regardless of transaction type mismatch beyond its own direction", () => {
    const creditResult = categorize(transaction({ description: "RENDIMENTO", type: "credit" }), []);
    const debitResult = categorize(transaction({ description: "RENDIMENTO", type: "debit" }), []);
    expect(creditResult?.subcategory).toEqual({ type: "product", id: "income.yields" });
    expect(debitResult).toBeNull();
  });
});

describe("orderRules", () => {
  it("orders more specific rules (more tokens) before less specific ones", () => {
    const specific = rule({ id: "a", pattern: "UBER EATS" });
    const generic = rule({ id: "b", pattern: "UBER" });
    expect(orderRules([generic, specific])).toEqual([specific, generic]);
  });

  it("breaks token-count ties with the longer pattern", () => {
    const longer = rule({ id: "a", pattern: "MERCADAO CENTRAL" });
    const shorter = rule({ id: "b", pattern: "MERCADO CENTRO" });
    expect(orderRules([shorter, longer])[0]?.id).toBe("a");
  });

  it("breaks pattern ties with the newest createdAt first", () => {
    const older = rule({
      id: "a",
      pattern: "MERCADO",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });
    const newer = rule({
      id: "b",
      pattern: "MERCADO",
      createdAt: new Date("2026-02-01T00:00:00Z"),
    });
    expect(orderRules([older, newer])).toEqual([newer, older]);
  });

  it("breaks remaining ties with ascending id, regardless of input order", () => {
    const first = rule({
      id: "a",
      pattern: "MERCADO",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });
    const second = rule({
      id: "b",
      pattern: "MERCADO",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });
    expect(orderRules([second, first])).toEqual([first, second]);
    expect(orderRules([first, second])).toEqual([first, second]);
  });

  it("keeps a stable relative order for two otherwise identical rules with the same id", () => {
    const first = rule({
      id: "same",
      pattern: "MERCADO",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });
    const second = rule({
      id: "same",
      pattern: "MERCADO",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });
    expect(orderRules([first, second])).toEqual([first, second]);
  });

  it("makes UBER EATS beat UBER for a matching description regardless of input order", () => {
    const uberEats = rule({
      id: "eats",
      pattern: "UBER EATS",
      subcategory: { type: "product", id: "food.delivery" },
    });
    const uber = rule({
      id: "ride",
      pattern: "UBER",
      subcategory: { type: "product", id: "transport.ride-hailing" },
    });
    const result = categorize(
      transaction({ description: "UBER EATS PENDING" }),
      orderRules([uber, uberEats]),
    );
    expect(result?.subcategory).toEqual({ type: "product", id: "food.delivery" });
  });
});

describe("categorize with realistic Pluggy-shaped fixtures", () => {
  it("categorizes a PIX transfer description via a household rule", () => {
    const description = "PIX ENVIADO CONDOMINIO RESIDENCIAL";
    expect(normalizeDescription(description)).toBe(description);
    const result = categorize(
      transaction({ description, providerCategory: "Transfers" }),
      orderRules([
        rule({ pattern: "CONDOMINIO", subcategory: { type: "product", id: "housing.condo" } }),
      ]),
    );
    expect(result?.subcategory).toEqual({ type: "product", id: "housing.condo" });
  });
});
