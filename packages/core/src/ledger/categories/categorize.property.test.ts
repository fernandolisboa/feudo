import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  categorize,
  orderRules,
  type CategorizableTransaction,
  type CategorizationRule,
} from "./categorize";

const directionArb = fc.constantFrom<"credit" | "debit" | null>("credit", "debit", null);
const patternWordArb = fc.constantFrom("MERCADO", "UBER", "EATS", "PIX", "CONDOMINIO", "FATURA");

const ruleArb: fc.Arbitrary<CategorizationRule> = fc.record({
  id: fc.uuid(),
  pattern: fc.array(patternWordArb, { minLength: 1, maxLength: 3 }).map((words) => words.join(" ")),
  direction: directionArb,
  subcategory: fc.constantFrom(
    { type: "product" as const, id: "food.groceries" as const },
    { type: "product" as const, id: "transport.ride-hailing" as const },
    { type: "household" as const, id: "custom-1" },
  ),
  createdAt: fc.date({ min: new Date("2020-01-01"), max: new Date("2030-01-01") }),
});

const rulesAndShuffleArb = fc
  .array(ruleArb, { maxLength: 6 })
  .chain((rules) =>
    fc.tuple(
      fc.constant(rules),
      fc.shuffledSubarray(rules, { minLength: rules.length, maxLength: rules.length }),
    ),
  );

const transactionArb: fc.Arbitrary<CategorizableTransaction> = fc.record({
  description: fc.constantFrom(
    "PIX ENVIADO CONDOMINIO RESIDENCIAL",
    "UBER EATS PENDING",
    "PAGAMENTO FATURA CARTAO",
    "COMPRA CARTAO MERCADO",
    "SOMETHING ELSE ENTIRELY",
  ),
  type: fc.constantFrom<"credit" | "debit">("credit", "debit"),
  providerCategory: fc.constantFrom<string | null>(null, "Groceries", "Other", "Unknown"),
  manual: fc.constant(null),
});

describe("categorize property tests", () => {
  it("is independent of the input order of rules once ordered via orderRules", () => {
    fc.assert(
      fc.property(rulesAndShuffleArb, transactionArb, ([rules, shuffled], transaction) => {
        expect(categorize(transaction, orderRules(shuffled))).toEqual(
          categorize(transaction, orderRules(rules)),
        );
      }),
    );
  });
});
