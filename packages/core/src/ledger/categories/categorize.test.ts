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
    amountCentavos: -1000,
    currency: "BRL",
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
    amount: null,
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

describe("categorize with amount-bound rules", () => {
  const rent: CategorizationRule = rule({
    id: "rent",
    pattern: "PIX JOAO SILVA",
    amount: { amountCentavos: 150000, currency: "BRL" },
    subcategory: { type: "product", id: "housing.rent" },
  });

  it("applies an amount-bound rule to a transaction of that absolute amount", () => {
    const result = categorize(
      transaction({ description: "PIX JOAO SILVA", amountCentavos: -150000 }),
      [rent],
    );
    expect(result).toEqual({
      subcategory: { type: "product", id: "housing.rent" },
      source: "rule",
      ruleId: "rent",
    });
  });

  it("reads the amount by absolute value, whatever sign the provider used", () => {
    const result = categorize(
      transaction({ description: "PIX JOAO SILVA", amountCentavos: 150000 }),
      [rent],
    );
    expect(result?.ruleId).toBe("rent");
  });

  it("skips an amount-bound rule for the same amount in another currency", () => {
    const result = categorize(
      transaction({ description: "PIX JOAO SILVA", amountCentavos: -150000, currency: "USD" }),
      [rent],
    );
    expect(result).toBeNull();
  });

  it("skips an amount-bound rule for the same description with another amount", () => {
    const result = categorize(
      transaction({ description: "PIX JOAO SILVA", amountCentavos: -4200 }),
      [rent],
    );
    expect(result).toBeNull();
  });

  it("lets an amount-bound rule beat a more specific unbound one", () => {
    const longer = rule({
      id: "longer",
      pattern: "PIX JOAO SILVA SANTOS",
      subcategory: { type: "product", id: "food.groceries" },
    });
    const ordered = orderRules([longer, rent]);

    expect(ordered.map((r) => r.id)).toEqual(["rent", "longer"]);
    expect(
      categorize(
        transaction({ description: "PIX JOAO SILVA SANTOS", amountCentavos: -150000 }),
        ordered,
      )?.ruleId,
    ).toBe("rent");
    expect(
      categorize(
        transaction({ description: "PIX JOAO SILVA SANTOS", amountCentavos: -4200 }),
        ordered,
      )?.ruleId,
    ).toBe("longer");
  });

  it("applies an amount-bound rule to an amount a few centavos away, as an installment rounds", () => {
    const [near, tooFar] = [-150010, -150011].map((amountCentavos) =>
      categorize(transaction({ description: "PIX JOAO SILVA", amountCentavos }), [rent]),
    );
    expect(near?.ruleId).toBe("rent");
    expect(tooFar).toBeNull();
  });

  it("picks the amount-bound rule nearest to the transaction's amount", () => {
    const far = rule({
      id: "far",
      pattern: "PIX JOAO SILVA SANTOS",
      amount: { amountCentavos: 150008, currency: "BRL" },
    });
    const near = rule({
      id: "near",
      pattern: "PIX",
      amount: { amountCentavos: 150002, currency: "BRL" },
    });
    const anyAmount = rule({ id: "any", pattern: "PIX JOAO SILVA SANTOS DE SOUZA" });

    for (const rules of [
      [far, near, anyAmount],
      [anyAmount, near, far],
    ]) {
      expect(
        categorize(
          transaction({
            description: "PIX JOAO SILVA SANTOS DE SOUZA",
            amountCentavos: -150003,
          }),
          orderRules(rules),
        )?.ruleId,
      ).toBe("near");
    }
  });

  it("lets an exact-amount rule beat a nearer-ordered one within tolerance", () => {
    const nearButFirst = rule({
      id: "near",
      pattern: "PIX JOAO SILVA SANTOS",
      amount: { amountCentavos: 150003, currency: "BRL" },
    });
    const exact = rule({
      id: "exact",
      pattern: "PIX",
      amount: { amountCentavos: 150000, currency: "BRL" },
    });

    expect(
      categorize(
        transaction({ description: "PIX JOAO SILVA SANTOS", amountCentavos: -150000 }),
        orderRules([nearButFirst, exact]),
      )?.ruleId,
    ).toBe("exact");
  });

  it("breaks a tie between two equally near rules by the existing order", () => {
    const below = rule({
      id: "below",
      pattern: "PIX JOAO",
      amount: { amountCentavos: 149998, currency: "BRL" },
    });
    const above = rule({
      id: "above",
      pattern: "PIX JOAO SILVA",
      amount: { amountCentavos: 150002, currency: "BRL" },
    });

    for (const rules of [
      [below, above],
      [above, below],
    ]) {
      expect(
        categorize(
          transaction({ description: "PIX JOAO SILVA", amountCentavos: -150000 }),
          orderRules(rules),
        )?.ruleId,
      ).toBe("above");
    }
  });

  it("keeps the existing ordering among amount-bound rules", () => {
    const short = rule({
      id: "short",
      pattern: "PIX",
      amount: { amountCentavos: 150000, currency: "BRL" },
    });
    const other = rule({
      id: "other",
      pattern: "PIX JOAO SILVA",
      amount: { amountCentavos: 4200, currency: "BRL" },
    });

    expect(orderRules([short, other, rent]).map((r) => r.id)).toEqual(["other", "rent", "short"]);
  });
});
