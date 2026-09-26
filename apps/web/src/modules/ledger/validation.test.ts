import { describe, expect, it } from "vitest";

import { encodeSubcategoryRef } from "./subcategory-ref";
import { categorizeTransactionFormSchema } from "./validation";

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
