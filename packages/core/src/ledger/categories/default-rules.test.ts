import { describe, expect, it } from "vitest";
import { PRODUCT_DEFAULT_RULES } from "./default-rules";
import { normalizeDescription, matchesPattern } from "./description";
import { isProductSubcategoryId } from "./taxonomy";

describe("PRODUCT_DEFAULT_RULES", () => {
  it("has an already-normalized pattern for every rule", () => {
    for (const rule of PRODUCT_DEFAULT_RULES) {
      expect(normalizeDescription(rule.pattern), rule.pattern).toBe(rule.pattern);
    }
  });

  it("targets a valid product subcategory for every rule", () => {
    for (const rule of PRODUCT_DEFAULT_RULES) {
      expect(isProductSubcategoryId(rule.subcategoryId), rule.subcategoryId).toBe(true);
    }
  });

  it("matches a realistic Brazilian statement description for UBER EATS before the plain UBER rule", () => {
    const description = normalizeDescription("UBER EATS PENDING");
    const matching = PRODUCT_DEFAULT_RULES.filter((rule) =>
      matchesPattern(description, rule.pattern),
    );
    expect(matching.map((rule) => rule.subcategoryId)).toEqual(
      expect.arrayContaining(["food.delivery", "transport.ride-hailing"]),
    );
    const mostSpecific = matching.reduce((longest, rule) =>
      rule.pattern.split(" ").length > longest.pattern.split(" ").length ? rule : longest,
    );
    expect(mostSpecific.subcategoryId).toBe("food.delivery");
  });

  it("matches PAGAMENTO FATURA CARTAO to the card-bill subcategory with debit direction", () => {
    const description = normalizeDescription("PAGAMENTO FATURA CARTAO");
    const rule = PRODUCT_DEFAULT_RULES.find((candidate) =>
      matchesPattern(description, candidate.pattern),
    );
    expect(rule?.subcategoryId).toBe("transfers.card-bill");
    expect(rule?.direction).toBe("debit");
  });
});
