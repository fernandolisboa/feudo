import { describe, expect, it } from "vitest";
import { NonIntegerAmountError, type Money } from "../../money/money";
import type { Categorization } from "./categorize";
import { summarizeUncategorized } from "./uncategorized";

function brl(amountCentavos: number): Money {
  return { amountCentavos, currency: "BRL" };
}

const manual: Categorization = {
  subcategory: { type: "product", id: "food.groceries" },
  source: "manual",
  ruleId: null,
};

describe("summarizeUncategorized", () => {
  it("returns an empty summary for no items", () => {
    expect(summarizeUncategorized([])).toEqual({ count: 0, totals: [] });
  });

  it("ignores categorized items", () => {
    const result = summarizeUncategorized([{ categorization: manual, amount: brl(1000) }]);
    expect(result).toEqual({ count: 0, totals: [] });
  });

  it("counts uncategorized items and sums their absolute amounts", () => {
    const result = summarizeUncategorized([
      { categorization: null, amount: brl(-5000) },
      { categorization: null, amount: brl(1200) },
      { categorization: manual, amount: brl(999) },
    ]);
    expect(result).toEqual({ count: 2, totals: [brl(6200)] });
  });

  it("sums debits and credits together as absolute values", () => {
    const result = summarizeUncategorized([
      { categorization: null, amount: brl(-100) },
      { categorization: null, amount: brl(-100) },
    ]);
    expect(result.totals).toEqual([brl(200)]);
  });

  it("keeps one total per currency instead of adding across them", () => {
    const result = summarizeUncategorized([
      { categorization: null, amount: { amountCentavos: -2000, currency: "USD" } },
      { categorization: null, amount: brl(-300) },
      { categorization: null, amount: { amountCentavos: 500, currency: "USD" } },
    ]);
    expect(result).toEqual({
      count: 3,
      totals: [brl(300), { amountCentavos: 2500, currency: "USD" }],
    });
  });

  it("refuses a total that is no longer a safe integer", () => {
    expect(() =>
      summarizeUncategorized([
        { categorization: null, amount: brl(Number.MAX_SAFE_INTEGER) },
        { categorization: null, amount: brl(1) },
      ]),
    ).toThrow(NonIntegerAmountError);
  });
});
