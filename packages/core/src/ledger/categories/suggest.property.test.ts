import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { Categorization } from "./categorize";
import { buildCategorizationQueue, type QueueCandidate } from "./suggest";

const categorizations: (Categorization | null)[] = [
  null,
  { subcategory: { type: "product", id: "food.groceries" }, source: "manual", ruleId: null },
  { subcategory: { type: "product", id: "food.restaurants" }, source: "rule", ruleId: "r1" },
  { subcategory: { type: "household", id: "sub-1" }, source: "manual", ruleId: null },
  {
    subcategory: { type: "product", id: "transfers.own-accounts" },
    source: "internal_transfer",
    ruleId: null,
  },
];

const candidateArb = fc.record({
  description: fc.constantFrom(
    "PADARIA DO ZE",
    "COMPRA CARTAO 1234 PADARIA DO ZE",
    "UBER TRIP 99",
    "PIX RECEBIDO MARIA",
    "TED 001 EMPRESA",
    "***",
  ),
  type: fc.constantFrom("credit" as const, "debit" as const),
  amountCentavos: fc.integer({ min: -1_000_000_00, max: 1_000_000_00 }),
  date: fc.constantFrom("2026-07-01", "2026-08-15", "2026-09-30"),
  categorization: fc.constantFrom(...categorizations),
});

const candidatesArb = fc
  .array(candidateArb, { maxLength: 40 })
  .map((items): QueueCandidate[] =>
    items.map((item, index) => ({ ...item, id: `t${String(index).padStart(3, "0")}` })),
  );

describe("buildCategorizationQueue property tests", () => {
  it("lists every uncategorized transaction exactly once, largest amount first", () => {
    fc.assert(
      fc.property(candidatesArb, (candidates) => {
        const queue = buildCategorizationQueue(candidates);
        const expected = candidates.filter((c) => c.categorization === null).map((c) => c.id);
        expect([...queue.map((item) => item.id)].sort()).toEqual([...expected].sort());

        const byId = new Map(candidates.map((c) => [c.id, c]));
        const amounts = queue.map((item) => Math.abs(byId.get(item.id)?.amountCentavos ?? 0));
        for (let index = 1; index < amounts.length; index += 1) {
          expect(amounts[index]).toBeLessThanOrEqual(amounts[index - 1] ?? 0);
        }
      }),
    );
  });

  it("suggests only what the household already chose in the same direction, or income for credits", () => {
    fc.assert(
      fc.property(candidatesArb, (candidates) => {
        const byId = new Map(candidates.map((c) => [c.id, c]));
        for (const item of buildCategorizationQueue(candidates)) {
          const own = byId.get(item.id);
          expect(item.type).toBe(own?.type);
          const suggestion = item.suggestion;
          if (suggestion === null) {
            expect(item.type).toBe("debit");
            continue;
          }
          if (suggestion.reason === "credit") {
            expect(item.type).toBe("credit");
            expect(suggestion.subcategory).toEqual({ type: "product", id: "income.other" });
            continue;
          }
          const sources = candidates.filter(
            (c) =>
              c.type === item.type &&
              c.categorization !== null &&
              c.categorization.source !== "internal_transfer" &&
              c.categorization.subcategory.type === suggestion.subcategory.type &&
              c.categorization.subcategory.id === suggestion.subcategory.id,
          );
          expect(sources.length).toBeGreaterThanOrEqual(suggestion.matches);
          expect(suggestion.matches).toBeGreaterThan(0);
        }
      }),
    );
  });

  it("never counts more similar transactions than the other uncategorized ones in that direction", () => {
    fc.assert(
      fc.property(candidatesArb, (candidates) => {
        for (const item of buildCategorizationQueue(candidates)) {
          const sameDirection = candidates.filter(
            (c) => c.categorization === null && c.type === item.type && c.id !== item.id,
          );
          expect(item.similarCount).toBeGreaterThanOrEqual(0);
          expect(item.similarCount).toBeLessThanOrEqual(sameDirection.length);
        }
      }),
    );
  });
});
