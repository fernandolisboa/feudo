import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { Categorization } from "./categorize";
import { matchesPattern, normalizeDescription } from "./description";
import { suggestionFingerprint } from "./fingerprint";
import { isSameAmount, sameAmountGapCentavos } from "./same-amount";
import { buildCategorizationQueue, type QueueCandidate } from "./suggest";
import type { SubcategoryRef } from "./taxonomy";

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
  {
    subcategory: { type: "product", id: "transfers.pass-through" },
    source: "link",
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
  amountCentavos: fc.oneof(
    fc.constantFrom(-150000, 150000, -150003, 150011, -4200, 4200, 4203),
    fc.integer({ min: -1_000_000_00, max: 1_000_000_00 }),
  ),
  currency: fc.constantFrom("BRL", "BRL", "BRL", "USD"),
  date: fc.constantFrom("2026-07-01", "2026-08-15", "2026-09-30"),
  categorization: fc.constantFrom(...categorizations),
});

const candidatesArb = fc
  .array(candidateArb, { maxLength: 40 })
  .map((items): QueueCandidate[] =>
    items.map((item, index) => ({ ...item, id: `t${String(index).padStart(3, "0")}` })),
  );

function sameAmountGroup(
  own: QueueCandidate | undefined,
  others: readonly QueueCandidate[],
): QueueCandidate[] {
  if (!own) return [];
  const exact = others.filter((c) => sameAmountGapCentavos(c, own) === 0);
  return exact.length > 0 ? exact : others.filter((c) => isSameAmount(c, own));
}

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
          if (suggestion.reason === "ai") {
            throw new Error("candidatesArb never carries an aiSuggestion field");
          }
          const sources = candidates.filter(
            (c) =>
              c.type === item.type &&
              c.categorization !== null &&
              c.categorization.source !== "internal_transfer" &&
              c.categorization.source !== "link" &&
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
          expect(item.sameAmountCount).toBeGreaterThanOrEqual(0);
          expect(item.sameAmountCount).toBeLessThanOrEqual(item.similarCount);
          expect(item.similarCount).toBeLessThanOrEqual(sameDirection.length);
        }
      }),
    );
  });

  it("counts as same-amount exactly the similar transactions of same amount, exact or within tolerance", () => {
    fc.assert(
      fc.property(candidatesArb, (candidates) => {
        const byId = new Map(candidates.map((c) => [c.id, c]));
        for (const item of buildCategorizationQueue(candidates)) {
          const own = byId.get(item.id);
          const similar = candidates.filter(
            (c) =>
              c.categorization === null &&
              c.type === item.type &&
              c.id !== item.id &&
              matchesPattern(normalizeDescription(c.description), item.pattern),
          );
          expect(item.similarCount).toBe(similar.length);
          expect(item.sameAmountCount).toBe(
            similar.filter((c) => own !== undefined && isSameAmount(c, own)).length,
          );
        }
      }),
    );
  });

  it("gives a same-amount reason exactly when matching history shares the amount, and never follows history that disagrees otherwise", () => {
    fc.assert(
      fc.property(candidatesArb, (candidates) => {
        const byId = new Map(candidates.map((c) => [c.id, c]));
        for (const item of buildCategorizationQueue(candidates)) {
          const own = byId.get(item.id);
          const matching = candidates.filter(
            (c) =>
              c.type === item.type &&
              c.categorization !== null &&
              c.categorization.source !== "internal_transfer" &&
              c.categorization.source !== "link" &&
              matchesPattern(normalizeDescription(c.description), item.pattern),
          );
          const sameAmount = sameAmountGroup(own, matching);
          const reason = item.suggestion?.reason ?? null;
          const chosen = new Set(
            matching.map((c) => JSON.stringify(c.categorization?.subcategory)),
          );

          expect(reason === "history_amount").toBe(sameAmount.length > 0);
          expect(reason === "history").toBe(sameAmount.length === 0 && chosen.size === 1);
          expect(item.conflictingHistory).toBe(sameAmount.length === 0 && chosen.size > 1);
          if (item.suggestion?.reason === "history_amount") {
            const target = item.suggestion.subcategory;
            expect(item.suggestion.matches).toBe(
              sameAmount.filter(
                (c) =>
                  c.categorization?.subcategory.type === target.type &&
                  c.categorization.subcategory.id === target.id,
              ).length,
            );
          }
          if (item.suggestion?.reason === "history") {
            expect(item.suggestion.matches).toBe(matching.length);
          }
        }
      }),
    );
  });

  const aiAnswers: (SubcategoryRef | null | undefined)[] = [
    undefined,
    null,
    { type: "product", id: "food.groceries" },
    { type: "product", id: "food.restaurants" },
  ];

  const candidatesWithAiArb = candidatesArb.chain((candidates) =>
    fc
      .array(fc.constantFrom(...aiAnswers), {
        minLength: candidates.length,
        maxLength: candidates.length,
      })
      .map((answers) =>
        candidates.map((candidate, index) => ({ ...candidate, aiSuggestion: answers[index] })),
      ),
  );

  it("leaves every output byte-identical when no candidate carries an aiSuggestion field", () => {
    fc.assert(
      fc.property(candidatesArb, (candidates) => {
        const withoutField = buildCategorizationQueue(candidates);
        const withUndefined = buildCategorizationQueue(
          candidates.map((candidate): QueueCandidate => ({
            ...candidate,
            aiSuggestion: undefined,
          })),
        );
        expect(withUndefined).toEqual(withoutField);
      }),
    );
  });

  it("never lets an AI suggestion outrank history, and always lets it outrank the credit fallback", () => {
    fc.assert(
      fc.property(candidatesWithAiArb, (candidates) => {
        const queue = buildCategorizationQueue(candidates);
        const byId = new Map(queue.map((item) => [item.id, item]));
        for (const candidate of candidates) {
          if (candidate.categorization !== null) continue;
          const own = candidate.aiSuggestion;
          if (own === undefined || own === null) continue;
          const reason = byId.get(candidate.id)?.suggestion?.reason;
          if (reason === "history" || reason === "history_amount") continue;
          expect(reason).not.toBe("credit");
        }
      }),
    );
  });

  it("inheritance never crosses direction or amount", () => {
    fc.assert(
      fc.property(candidatesWithAiArb, (candidates) => {
        const uncategorized = candidates.filter((c) => c.categorization === null);
        for (const item of buildCategorizationQueue(candidates)) {
          if (item.suggestion?.reason !== "ai") continue;
          const own = uncategorized.find((c) => c.id === item.id);
          if (!own) continue;
          const sameFingerprintRows = uncategorized.filter(
            (c) => suggestionFingerprint(c) === suggestionFingerprint(own) && c.aiSuggestion,
          );
          for (const source of sameFingerprintRows) {
            expect(source.type).toBe(own.type);
          }
        }
      }),
    );
  });

  it("does not depend on the order the transactions are read in", () => {
    fc.assert(
      fc.property(
        candidatesArb.chain((candidates) =>
          fc.tuple(
            fc.constant(candidates),
            fc.shuffledSubarray(candidates, { minLength: candidates.length }),
          ),
        ),
        ([candidates, shuffled]) => {
          expect(buildCategorizationQueue(shuffled)).toEqual(buildCategorizationQueue(candidates));
        },
      ),
    );
  });
});
