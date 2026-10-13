import { describe, expect, it } from "vitest";

import type { Categorization, CategorizationSource } from "./categorize";
import { buildCategorizationQueue, type QueueCandidate } from "./suggest";
import type { SubcategoryRef } from "./taxonomy";

const GROCERIES: SubcategoryRef = { type: "product", id: "food.groceries" };
const RESTAURANTS: SubcategoryRef = { type: "product", id: "food.restaurants" };
const SALARY: SubcategoryRef = { type: "product", id: "income.salary" };
const OWN_ACCOUNTS: SubcategoryRef = { type: "product", id: "transfers.own-accounts" };

function categorized(
  subcategory: SubcategoryRef,
  source: CategorizationSource = "manual",
): Categorization {
  return { subcategory, source, ruleId: null };
}

let nextId = 0;
function candidate(overrides: Partial<QueueCandidate>): QueueCandidate {
  nextId += 1;
  return {
    id: `t${String(nextId).padStart(3, "0")}`,
    description: "COMPRA CARTAO 1234 PADARIA DO ZE",
    type: "debit",
    amountCentavos: -1000,
    date: "2026-09-10",
    categorization: null,
    ...overrides,
  };
}

describe("buildCategorizationQueue", () => {
  it("returns nothing when every transaction has a category", () => {
    expect(
      buildCategorizationQueue([candidate({ categorization: categorized(GROCERIES) })]),
    ).toEqual([]);
  });

  it("lists only uncategorized transactions, largest amount first", () => {
    const small = candidate({ description: "LOJA A", amountCentavos: -500 });
    const big = candidate({ description: "LOJA B", amountCentavos: -90000 });
    const income = candidate({ description: "LOJA C", type: "credit", amountCentavos: 4000 });
    const done = candidate({ description: "LOJA D", categorization: categorized(GROCERIES) });

    const queue = buildCategorizationQueue([small, big, income, done]);

    expect(queue.map((item) => item.id)).toEqual([big.id, income.id, small.id]);
  });

  it("breaks amount ties by the newest date, then by id", () => {
    const older = candidate({ description: "LOJA A", date: "2026-08-01" });
    const newerB = candidate({ id: "b", description: "LOJA B", date: "2026-09-01" });
    const newerA = candidate({ id: "a", description: "LOJA C", date: "2026-09-01" });

    const queue = buildCategorizationQueue([older, newerB, newerA]);

    expect(queue.map((item) => item.id)).toEqual(["a", "b", older.id]);
  });

  it("proposes the rule pattern a member would get in the categorize dialog", () => {
    const [item] = buildCategorizationQueue([
      candidate({ description: "COMPRA CARTAO 1234 PADARIA DO ZE" }),
    ]);
    expect(item?.pattern).toBe("PADARIA DO ZE");
  });

  it("suggests the subcategory already used for the same description and direction", () => {
    const queue = buildCategorizationQueue([
      candidate({ description: "PADARIA DO ZE 01/09", categorization: categorized(GROCERIES) }),
      candidate({ description: "PADARIA DO ZE 15/09" }),
    ]);

    expect(queue).toHaveLength(1);
    expect(queue[0]?.suggestion).toEqual({
      subcategory: GROCERIES,
      reason: "history",
      matches: 1,
    });
  });

  it("picks the subcategory used most often among matching transactions", () => {
    const queue = buildCategorizationQueue([
      candidate({ categorization: categorized(GROCERIES) }),
      candidate({ categorization: categorized(RESTAURANTS) }),
      candidate({ categorization: categorized(RESTAURANTS, "rule") }),
      candidate({}),
    ]);

    expect(queue[0]?.suggestion).toEqual({
      subcategory: RESTAURANTS,
      reason: "history",
      matches: 2,
    });
  });

  it("on a tie, follows the most recent categorized transaction", () => {
    const queue = buildCategorizationQueue([
      candidate({ date: "2026-07-01", categorization: categorized(GROCERIES) }),
      candidate({ date: "2026-09-01", categorization: categorized(RESTAURANTS) }),
      candidate({ date: "2026-09-20" }),
    ]);

    expect(queue[0]?.suggestion?.subcategory).toEqual(RESTAURANTS);
  });

  it("treats household subcategories as their own target", () => {
    const household: SubcategoryRef = { type: "household", id: "sub-1" };
    const queue = buildCategorizationQueue([
      candidate({ categorization: categorized(household) }),
      candidate({}),
    ]);

    expect(queue[0]?.suggestion?.subcategory).toEqual(household);
  });

  it("ignores history in the other direction", () => {
    const queue = buildCategorizationQueue([
      candidate({ type: "credit", amountCentavos: 1000, categorization: categorized(SALARY) }),
      candidate({ type: "debit" }),
    ]);

    expect(queue[0]?.suggestion).toBeNull();
  });

  it("ignores transactions placed only by internal-transfer pairing", () => {
    const queue = buildCategorizationQueue([
      candidate({ categorization: categorized(OWN_ACCOUNTS, "internal_transfer") }),
      candidate({}),
    ]);

    expect(queue[0]?.suggestion).toBeNull();
  });

  it("suggests income for money coming in with no history", () => {
    const queue = buildCategorizationQueue([
      candidate({ description: "TED RECEBIDA EMPRESA X", type: "credit", amountCentavos: 900000 }),
    ]);

    expect(queue[0]?.suggestion).toEqual({
      subcategory: { type: "product", id: "income.other" },
      reason: "credit",
    });
  });

  it("prefers history over the income fallback for credits", () => {
    const queue = buildCategorizationQueue([
      candidate({
        description: "PIX RECEBIDO MARIA",
        type: "credit",
        amountCentavos: 5000,
        categorization: categorized(OWN_ACCOUNTS),
      }),
      candidate({ description: "PIX RECEBIDO MARIA", type: "credit", amountCentavos: 7000 }),
    ]);

    expect(queue[0]?.suggestion).toEqual({
      subcategory: OWN_ACCOUNTS,
      reason: "history",
      matches: 1,
    });
  });

  it("counts the other uncategorized transactions a rule on the pattern would also take", () => {
    const queue = buildCategorizationQueue([
      candidate({ description: "UBER TRIP 111" }),
      candidate({ description: "UBER TRIP 222" }),
      candidate({ description: "UBER TRIP 333" }),
      candidate({ description: "UBER TRIP 444", type: "credit", amountCentavos: 100 }),
      candidate({ description: "IFOOD" }),
    ]);

    const uberDebits = queue.filter(
      (item) => item.pattern === "UBER TRIP" && item.type === "debit",
    );
    expect(uberDebits.map((item) => item.similarCount)).toEqual([2, 2, 2]);
    expect(queue.find((item) => item.type === "credit")?.similarCount).toBe(0);
    expect(queue.find((item) => item.pattern === "IFOOD")?.similarCount).toBe(0);
  });
});
