import { describe, expect, it } from "vitest";
import { parseYearMonth, type YearMonth } from "../year-month";
import { suggestFixedSubcategories, type RecurringInput } from "./recurring";
import type { SubcategoryRef } from "./taxonomy";

const MONTHS: readonly [YearMonth, YearMonth, YearMonth] = [
  parseYearMonth("2026-06"),
  parseYearMonth("2026-07"),
  parseYearMonth("2026-08"),
];

const foodDelivery: SubcategoryRef = { type: "product", id: "food.delivery" };
const fuel: SubcategoryRef = { type: "product", id: "transport.fuel" };

function debit(
  yearMonth: YearMonth,
  description: string,
  amountCentavos: number,
  subcategory: SubcategoryRef,
): RecurringInput {
  return { yearMonth, description, type: "debit", amountCentavos, subcategory, kind: "variable" };
}

describe("suggestFixedSubcategories", () => {
  it("suggests fixed for a debit that recurs in every month within 10% of the median", () => {
    const items: RecurringInput[] = [
      debit(MONTHS[0], "IFOOD PENDING", 9800, foodDelivery),
      debit(MONTHS[1], "IFOOD PENDING", 10000, foodDelivery),
      debit(MONTHS[2], "IFOOD PENDING", 10500, foodDelivery),
    ];
    const result = suggestFixedSubcategories(items, MONTHS);
    expect(result).toEqual([
      { subcategory: foodDelivery, description: "IFOOD PENDING", months: MONTHS },
    ]);
  });

  it("does not suggest fixed when fewer than 3 months are requested", () => {
    const items: RecurringInput[] = [
      debit(MONTHS[0], "IFOOD", 10000, foodDelivery),
      debit(MONTHS[1], "IFOOD", 10000, foodDelivery),
    ];
    expect(suggestFixedSubcategories(items, MONTHS.slice(0, 2))).toEqual([]);
  });

  it("does not suggest fixed when the group is missing one of the requested months", () => {
    const items: RecurringInput[] = [
      debit(MONTHS[0], "IFOOD", 10000, foodDelivery),
      debit(MONTHS[2], "IFOOD", 10000, foodDelivery),
    ];
    expect(suggestFixedSubcategories(items, MONTHS)).toEqual([]);
  });

  it("does not suggest fixed when a month's total is more than 10% off the median", () => {
    const items: RecurringInput[] = [
      debit(MONTHS[0], "GASOLINA", 10000, fuel),
      debit(MONTHS[1], "GASOLINA", 20000, fuel),
      debit(MONTHS[2], "GASOLINA", 10000, fuel),
    ];
    expect(suggestFixedSubcategories(items, MONTHS)).toEqual([]);
  });

  it("ignores credit transactions", () => {
    const items: RecurringInput[] = [
      { ...debit(MONTHS[0], "IFOOD", 10000, foodDelivery), type: "credit" },
      debit(MONTHS[1], "IFOOD", 10000, foodDelivery),
      debit(MONTHS[2], "IFOOD", 10000, foodDelivery),
    ];
    expect(suggestFixedSubcategories(items, MONTHS)).toEqual([]);
  });

  it("ignores transactions whose kind is not variable", () => {
    const items: RecurringInput[] = [
      {
        ...debit(MONTHS[0], "NETFLIX", 4000, { type: "product", id: "bills.subscriptions" }),
        kind: "fixed",
      },
      {
        ...debit(MONTHS[1], "NETFLIX", 4000, { type: "product", id: "bills.subscriptions" }),
        kind: "fixed",
      },
      {
        ...debit(MONTHS[2], "NETFLIX", 4000, { type: "product", id: "bills.subscriptions" }),
        kind: "fixed",
      },
    ];
    expect(suggestFixedSubcategories(items, MONTHS)).toEqual([]);
  });

  it("groups by both subcategory and normalized description, treating unrelated descriptions separately", () => {
    const items: RecurringInput[] = [
      debit(MONTHS[0], "IFOOD", 10000, foodDelivery),
      debit(MONTHS[1], "IFOOD", 10000, foodDelivery),
      debit(MONTHS[2], "IFOOD", 10000, foodDelivery),
      debit(MONTHS[0], "UBER EATS", 5000, foodDelivery),
    ];
    const result = suggestFixedSubcategories(items, MONTHS);
    expect(result).toEqual([{ subcategory: foodDelivery, description: "IFOOD", months: MONTHS }]);
  });

  it("picks the qualifying group with the largest median when two groups share a subcategory", () => {
    const items: RecurringInput[] = [
      debit(MONTHS[0], "IFOOD", 5000, foodDelivery),
      debit(MONTHS[1], "IFOOD", 5000, foodDelivery),
      debit(MONTHS[2], "IFOOD", 5000, foodDelivery),
      debit(MONTHS[0], "RAPPI", 8000, foodDelivery),
      debit(MONTHS[1], "RAPPI", 8000, foodDelivery),
      debit(MONTHS[2], "RAPPI", 8000, foodDelivery),
    ];
    const result = suggestFixedSubcategories(items, MONTHS);
    expect(result).toEqual([{ subcategory: foodDelivery, description: "RAPPI", months: MONTHS }]);
  });

  it("breaks a median tie between two groups in the same subcategory by description", () => {
    const items: RecurringInput[] = [
      debit(MONTHS[0], "IFOOD", 5000, foodDelivery),
      debit(MONTHS[1], "IFOOD", 5000, foodDelivery),
      debit(MONTHS[2], "IFOOD", 5000, foodDelivery),
      debit(MONTHS[0], "RAPPI", 5000, foodDelivery),
      debit(MONTHS[1], "RAPPI", 5000, foodDelivery),
      debit(MONTHS[2], "RAPPI", 5000, foodDelivery),
    ];
    const result = suggestFixedSubcategories(items, MONTHS);
    expect(result).toEqual([{ subcategory: foodDelivery, description: "IFOOD", months: MONTHS }]);
  });

  it("computes the median as the rounded average of the two middle values for an even number of months", () => {
    const fourMonths: readonly [YearMonth, YearMonth, YearMonth, YearMonth] = [
      parseYearMonth("2026-05"),
      MONTHS[0],
      MONTHS[1],
      MONTHS[2],
    ];
    const items: RecurringInput[] = [
      debit(fourMonths[0], "IFOOD", 9800, foodDelivery),
      debit(fourMonths[1], "IFOOD", 10000, foodDelivery),
      debit(fourMonths[2], "IFOOD", 10100, foodDelivery),
      debit(fourMonths[3], "IFOOD", 10300, foodDelivery),
    ];
    const result = suggestFixedSubcategories(items, fourMonths);
    expect(result).toEqual([
      { subcategory: foodDelivery, description: "IFOOD", months: [...fourMonths].sort() },
    ]);
  });

  it("returns one suggestion per subcategory, ordered by subcategory key", () => {
    const items: RecurringInput[] = [
      debit(MONTHS[0], "IFOOD", 10000, foodDelivery),
      debit(MONTHS[1], "IFOOD", 10000, foodDelivery),
      debit(MONTHS[2], "IFOOD", 10000, foodDelivery),
      debit(MONTHS[0], "GASOLINA", 10000, fuel),
      debit(MONTHS[1], "GASOLINA", 10000, fuel),
      debit(MONTHS[2], "GASOLINA", 10000, fuel),
    ];
    const result = suggestFixedSubcategories(items, MONTHS);
    expect(result).toEqual([
      { subcategory: foodDelivery, description: "IFOOD", months: MONTHS },
      { subcategory: fuel, description: "GASOLINA", months: MONTHS },
    ]);
  });

  it("sums same-month, same-group transactions before comparing to the median", () => {
    const items: RecurringInput[] = [
      debit(MONTHS[0], "IFOOD", 5000, foodDelivery),
      debit(MONTHS[0], "IFOOD", 5000, foodDelivery),
      debit(MONTHS[1], "IFOOD", 10000, foodDelivery),
      debit(MONTHS[2], "IFOOD", 10000, foodDelivery),
    ];
    const result = suggestFixedSubcategories(items, MONTHS);
    expect(result).toEqual([{ subcategory: foodDelivery, description: "IFOOD", months: MONTHS }]);
  });
});
