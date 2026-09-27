import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { parseYearMonth, type YearMonth } from "../year-month";
import { suggestFixedSubcategories, type RecurringInput } from "./recurring";
import type { SubcategoryRef } from "./taxonomy";

const MONTHS: YearMonth[] = [
  parseYearMonth("2026-06"),
  parseYearMonth("2026-07"),
  parseYearMonth("2026-08"),
];

const subcategories: SubcategoryRef[] = [
  { type: "product", id: "food.delivery" },
  { type: "product", id: "transport.fuel" },
  { type: "household", id: "custom-1" },
];

const itemArb: fc.Arbitrary<RecurringInput> = fc.record({
  yearMonth: fc.constantFrom(...MONTHS),
  description: fc.constantFrom("IFOOD", "RAPPI", "GASOLINA POSTO"),
  type: fc.constantFrom<"credit" | "debit">("credit", "debit"),
  amountCentavos: fc.integer({ min: 1, max: 50_000 }),
  subcategory: fc.constantFrom(...subcategories),
  kind: fc.constantFrom<"income" | "fixed" | "variable" | "transfer">(
    "income",
    "fixed",
    "variable",
    "transfer",
  ),
});

const itemsAndShuffleArb = fc
  .array(itemArb, { maxLength: 12 })
  .chain((items) =>
    fc.tuple(
      fc.constant(items),
      fc.shuffledSubarray(items, { minLength: items.length, maxLength: items.length }),
    ),
  );

describe("suggestFixedSubcategories property tests", () => {
  it("is order-independent in its input", () => {
    fc.assert(
      fc.property(itemsAndShuffleArb, ([items, shuffled]) => {
        expect(suggestFixedSubcategories(shuffled, MONTHS)).toEqual(
          suggestFixedSubcategories(items, MONTHS),
        );
      }),
    );
  });
});
