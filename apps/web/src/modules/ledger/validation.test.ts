import { describe, expect, it } from "vitest";

import { encodeSubcategoryRef } from "./subcategory-ref";
import {
  categorizeTransactionFormSchema,
  overviewSearchParamsSchema,
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
