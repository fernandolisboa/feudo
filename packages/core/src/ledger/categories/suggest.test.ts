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
    currency: "BRL",
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
      candidate({
        description: "PADARIA DO ZE 01/09",
        amountCentavos: -2500,
        categorization: categorized(GROCERIES),
      }),
      candidate({ description: "PADARIA DO ZE 15/09" }),
    ]);

    expect(queue).toHaveLength(1);
    expect(queue[0]?.suggestion).toEqual({
      subcategory: GROCERIES,
      reason: "history",
      matches: 1,
    });
  });

  it("prefers history of the same amount, picking the subcategory used most often among it", () => {
    const queue = buildCategorizationQueue([
      candidate({ categorization: categorized(GROCERIES) }),
      candidate({ categorization: categorized(RESTAURANTS) }),
      candidate({ categorization: categorized(RESTAURANTS, "rule") }),
      candidate({ amountCentavos: -7700, categorization: categorized(GROCERIES) }),
      candidate({ amountCentavos: -7700, categorization: categorized(GROCERIES) }),
      candidate({ amountCentavos: -7700, categorization: categorized(GROCERIES) }),
      candidate({}),
    ]);

    expect(queue[0]?.suggestion).toEqual({
      subcategory: RESTAURANTS,
      reason: "history_amount",
      matches: 2,
    });
  });

  it("compares amounts by absolute value, whatever sign the provider used", () => {
    const queue = buildCategorizationQueue([
      candidate({ amountCentavos: 1000, categorization: categorized(GROCERIES) }),
      candidate({ amountCentavos: -1000 }),
    ]);

    expect(queue[0]?.suggestion).toEqual({
      subcategory: GROCERIES,
      reason: "history_amount",
      matches: 1,
    });
  });

  it("does not read the same number in another currency as the same amount", () => {
    const dollars = candidate({ currency: "USD" });
    const queue = buildCategorizationQueue([
      candidate({ categorization: categorized(GROCERIES) }),
      candidate({ amountCentavos: -300, categorization: categorized(RESTAURANTS) }),
      dollars,
      candidate({ currency: "USD" }),
      candidate({}),
    ]);
    const item = queue.find((queued) => queued.id === dollars.id);

    expect(item?.suggestion).toBeNull();
    expect(item?.conflictingHistory).toBe(true);
    expect([item?.sameAmountCount, item?.similarCount]).toEqual([1, 2]);
  });

  it("reads history a few centavos away as the same amount when none is exact", () => {
    const history = [
      candidate({ amountCentavos: -3816, categorization: categorized(RESTAURANTS) }),
      candidate({ amountCentavos: -3816, categorization: categorized(RESTAURANTS) }),
      candidate({ amountCentavos: -9000, categorization: categorized(GROCERIES) }),
    ];
    const odd = candidate({ amountCentavos: -3819 });

    for (const candidates of [[...history, odd], [odd, ...history].reverse()]) {
      expect(buildCategorizationQueue(candidates)[0]?.suggestion).toEqual({
        subcategory: RESTAURANTS,
        reason: "history_amount",
        matches: 2,
      });
    }
  });

  it("ignores history a few centavos away once some has exactly the amount", () => {
    const history = [
      candidate({ amountCentavos: -3819, categorization: categorized(GROCERIES) }),
      candidate({ amountCentavos: -3816, categorization: categorized(RESTAURANTS) }),
      candidate({ amountCentavos: -3816, categorization: categorized(RESTAURANTS) }),
      candidate({ amountCentavos: -3817, categorization: categorized(RESTAURANTS) }),
    ];
    const pending = candidate({ amountCentavos: -3819 });

    for (const candidates of [[...history, pending], [pending, ...history].reverse()]) {
      expect(buildCategorizationQueue(candidates)[0]?.suggestion).toEqual({
        subcategory: GROCERIES,
        reason: "history_amount",
        matches: 1,
      });
    }
  });

  it("does not read history 11 centavos away as the same amount", () => {
    const queue = buildCategorizationQueue([
      candidate({ amountCentavos: -150011, categorization: categorized(RESTAURANTS) }),
      candidate({ amountCentavos: -150000 }),
    ]);

    expect(queue[0]?.suggestion?.reason).toBe("history");
  });

  it("counts every pending one the amount-bound rule would take, exact or a few centavos away", () => {
    const a = candidate({ amountCentavos: -1000 });
    const b = candidate({ amountCentavos: -1000 });
    const c = candidate({ amountCentavos: -1005 });
    const unrelated = candidate({ amountCentavos: -9000 });

    const queue = buildCategorizationQueue([b, unrelated, c, a]);
    const counts = new Map(queue.map((item) => [item.id, item.sameAmountCount]));

    expect(counts.get(a.id)).toBe(2);
    expect(counts.get(b.id)).toBe(2);
    expect(counts.get(c.id)).toBe(2);
    expect(counts.get(unrelated.id)).toBe(0);
  });

  it("follows unanimous history of other amounts when none shares the amount", () => {
    const queue = buildCategorizationQueue([
      candidate({ amountCentavos: -300, categorization: categorized(GROCERIES) }),
      candidate({ amountCentavos: -450, categorization: categorized(GROCERIES, "rule") }),
      candidate({}),
    ]);

    expect(queue[0]?.suggestion).toEqual({
      subcategory: GROCERIES,
      reason: "history",
      matches: 2,
    });
  });

  it("suggests nothing when history disagrees and none shares the amount", () => {
    const queue = buildCategorizationQueue([
      candidate({ amountCentavos: -300, categorization: categorized(GROCERIES) }),
      candidate({ amountCentavos: -300, categorization: categorized(GROCERIES) }),
      candidate({ amountCentavos: -450, categorization: categorized(RESTAURANTS) }),
      candidate({}),
    ]);

    expect(queue[0]?.suggestion).toBeNull();
    expect(queue[0]?.conflictingHistory).toBe(true);
  });

  it("tells no history at all apart from history that disagrees", () => {
    const queue = buildCategorizationQueue([
      candidate({ description: "LOJA A" }),
      candidate({ description: "LOJA B", categorization: categorized(GROCERIES) }),
      candidate({ description: "LOJA B", amountCentavos: -300 }),
    ]);

    expect(queue.map((item) => [item.pattern, item.conflictingHistory])).toEqual([
      ["LOJA A", false],
      ["LOJA B", false],
    ]);
  });

  it("falls back to income for a credit whose history disagrees and shares no amount", () => {
    const queue = buildCategorizationQueue([
      candidate({ type: "credit", amountCentavos: 300, categorization: categorized(SALARY) }),
      candidate({ type: "credit", amountCentavos: 450, categorization: categorized(OWN_ACCOUNTS) }),
      candidate({ type: "credit", amountCentavos: 1000 }),
    ]);

    expect(queue[0]?.suggestion).toEqual({
      subcategory: { type: "product", id: "income.other" },
      reason: "credit",
    });
    expect(queue[0]?.conflictingHistory).toBe(true);
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

  it("counts apart the similar transactions that also share the amount", () => {
    const first = candidate({ description: "PIX ENVIADO JOAO SILVA", amountCentavos: -150000 });
    const second = candidate({ description: "PIX ENVIADO JOAO SILVA", amountCentavos: 150000 });
    const other = candidate({ description: "PIX ENVIADO JOAO SILVA", amountCentavos: -4200 });
    const credit = candidate({
      description: "PIX ENVIADO JOAO SILVA",
      type: "credit",
      amountCentavos: 150000,
    });
    const done = candidate({
      description: "PIX ENVIADO JOAO SILVA",
      amountCentavos: -150000,
      categorization: categorized(GROCERIES),
    });

    const queue = buildCategorizationQueue([first, second, other, credit, done]);
    const counts = new Map(
      queue.map((item) => [item.id, [item.sameAmountCount, item.similarCount]]),
    );

    expect(counts.get(first.id)).toEqual([1, 2]);
    expect(counts.get(second.id)).toEqual([1, 2]);
    expect(counts.get(other.id)).toEqual([0, 2]);
    expect(counts.get(credit.id)).toEqual([0, 0]);
  });
});
