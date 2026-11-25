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
  amount: fc.constantFrom<CategorizationRule["amount"]>(
    null,
    null,
    { amountCentavos: 1000, currency: "BRL" },
    { amountCentavos: 150000, currency: "BRL" },
    { amountCentavos: 150000, currency: "USD" },
  ),
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
  amountCentavos: fc.constantFrom(-150000, -1000, 1000, 150000, 4200),
  currency: fc.constantFrom("BRL", "BRL", "USD"),
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

  it("never applies an amount-bound rule to a transaction of another absolute amount or currency", () => {
    fc.assert(
      fc.property(fc.array(ruleArb, { maxLength: 6 }), transactionArb, (rules, transaction) => {
        const result = categorize(transaction, orderRules(rules));
        if (result?.source !== "rule") return;
        const applied = rules.find((rule) => rule.id === result.ruleId);
        expect(applied).toBeDefined();
        if (applied?.amount) {
          expect(Math.abs(transaction.amountCentavos)).toBe(applied.amount.amountCentavos);
          expect(transaction.currency).toBe(applied.amount.currency);
        }
      }),
    );
  });

  it("lets a matching amount-bound rule win over every unbound rule", () => {
    fc.assert(
      fc.property(fc.array(ruleArb, { maxLength: 6 }), transactionArb, (rules, transaction) => {
        const unbound = rules.map((rule) => ({ ...rule, amount: null }));
        const boundCouldApply = rules.some((rule, index) => {
          const alone = unbound[index];
          return (
            rule.amount?.amountCentavos === Math.abs(transaction.amountCentavos) &&
            rule.amount.currency === transaction.currency &&
            alone !== undefined &&
            categorize(transaction, [alone])?.source === "rule"
          );
        });
        if (!boundCouldApply) return;
        const result = categorize(transaction, orderRules(rules));
        const applied = rules.find((rule) => rule.id === result?.ruleId);
        expect(applied?.amount).toEqual({
          amountCentavos: Math.abs(transaction.amountCentavos),
          currency: transaction.currency,
        });
      }),
    );
  });
});
