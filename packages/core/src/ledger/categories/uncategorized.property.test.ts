import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { Money } from "../../money/money";
import type { Categorization } from "./categorize";
import { summarizeUncategorized } from "./uncategorized";

const manual: Categorization = {
  subcategory: { type: "product", id: "food.groceries" },
  source: "manual",
  ruleId: null,
};

const itemArb = fc.record({
  categorization: fc.constantFrom<Categorization | null>(null, manual),
  amount: fc
    .integer({ min: -1_000_000_00, max: 1_000_000_00 })
    .map((amountCentavos): Money => ({ amountCentavos, currency: "BRL" })),
});

describe("summarizeUncategorized property tests", () => {
  it("totals always equal the sum of absolute amounts of uncategorized items", () => {
    fc.assert(
      fc.property(fc.array(itemArb), (items) => {
        const { count, totals } = summarizeUncategorized(items);
        const uncategorized = items.filter((item) => item.categorization === null);
        expect(count).toBe(uncategorized.length);
        const expectedTotal = uncategorized.reduce(
          (sum, item) => sum + Math.abs(item.amount.amountCentavos),
          0,
        );
        const actualTotal = totals.reduce((sum, money) => sum + money.amountCentavos, 0);
        expect(actualTotal).toBe(expectedTotal);
        expect(totals.length).toBeLessThanOrEqual(1);
      }),
    );
  });
});
