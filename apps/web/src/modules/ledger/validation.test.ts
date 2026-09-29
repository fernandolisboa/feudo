import { describe, expect, it } from "vitest";

import { encodeSubcategoryRef } from "./subcategory-ref";
import {
  categorizeTransactionFormSchema,
  overviewSearchParamsSchema,
  SEARCH_QUERY_MAX_LENGTH,
  transactionsSearchParamsSchema,
} from "./validation";

const BASE = {
  transactionId: "tx-1",
  subcategory: encodeSubcategoryRef({ type: "product", id: "housing.rent" }),
};

describe("categorizeTransactionFormSchema", () => {
  it("normalizes the rule pattern the same way transaction descriptions are normalized", () => {
    const parsed = categorizeTransactionFormSchema.parse({
      ...BASE,
      createRule: "on",
      pattern: "  Pix Enviado – Condomínio  ",
      direction: "debit",
    });

    expect(parsed).toMatchObject({
      createRule: "on",
      pattern: "PIX ENVIADO CONDOMINIO",
      direction: "debit",
    });
  });

  it("rejects a pattern that normalizes to fewer than 3 characters", () => {
    const result = categorizeTransactionFormSchema.safeParse({
      ...BASE,
      createRule: "on",
      pattern: "A!!",
      direction: "debit",
    });

    expect(result.success).toBe(false);
  });

  it('treats the "any" direction option as no restriction', () => {
    const parsed = categorizeTransactionFormSchema.parse({
      ...BASE,
      createRule: "on",
      pattern: "MERCADO",
      direction: "any",
    });

    expect(parsed).toMatchObject({ direction: null });
  });

  it("rejects an unknown subcategory value", () => {
    const result = categorizeTransactionFormSchema.safeParse({
      transactionId: "tx-1",
      subcategory: "product:housing.castle",
      createRule: "off",
    });

    expect(result.success).toBe(false);
  });
});

describe("month search params bounds", () => {
  it("falls back to undefined for a year below 1970 on the overview", () => {
    expect(overviewSearchParamsSchema.parse({ mes: "0000-01" })).toEqual({ mes: undefined });
    expect(overviewSearchParamsSchema.parse({ mes: "0050-03" })).toEqual({ mes: undefined });
  });

  it("falls back to undefined for a year below 1970 on transactions", () => {
    expect(transactionsSearchParamsSchema.parse({ mes: "0000-01" })).toMatchObject({
      mes: undefined,
    });
    expect(transactionsSearchParamsSchema.parse({ mes: "0050-03" })).toMatchObject({
      mes: undefined,
    });
  });

  it("keeps a year within the bounded range on both schemas", () => {
    expect(overviewSearchParamsSchema.parse({ mes: "1970-01" })).toEqual({ mes: "1970-01" });
    expect(transactionsSearchParamsSchema.parse({ mes: "2026-09" })).toMatchObject({
      mes: "2026-09",
    });
  });
});

describe("transactionsSearchParamsSchema filters", () => {
  it("trims a search query and truncates it instead of rejecting it", () => {
    expect(transactionsSearchParamsSchema.parse({ busca: "  mercado  " })).toMatchObject({
      busca: "mercado",
    });
    const long = "a".repeat(SEARCH_QUERY_MAX_LENGTH + 20);
    expect(transactionsSearchParamsSchema.parse({ busca: long }).busca).toBe(
      long.slice(0, SEARCH_QUERY_MAX_LENGTH),
    );
  });

  it("falls back to undefined for a non-string search query", () => {
    expect(transactionsSearchParamsSchema.parse({ busca: 42 })).toMatchObject({ busca: undefined });
  });

  it("accepts the uncategorized marker or a top-level product category for categoria", () => {
    expect(transactionsSearchParamsSchema.parse({ categoria: "sem" })).toMatchObject({
      categoria: "sem",
    });
    expect(transactionsSearchParamsSchema.parse({ categoria: "housing" })).toMatchObject({
      categoria: "housing",
    });
  });

  it("falls back to undefined for an unknown categoria value", () => {
    expect(transactionsSearchParamsSchema.parse({ categoria: "castle" })).toMatchObject({
      categoria: undefined,
    });
  });

  it("accepts a known kind for tipo and falls back to undefined otherwise", () => {
    expect(transactionsSearchParamsSchema.parse({ tipo: "variable" })).toMatchObject({
      tipo: "variable",
    });
    expect(transactionsSearchParamsSchema.parse({ tipo: "unknown" })).toMatchObject({
      tipo: undefined,
    });
  });
});
