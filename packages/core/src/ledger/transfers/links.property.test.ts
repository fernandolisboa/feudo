import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { suggestLinks, type LinkableTransaction } from "./links";
import type {
  Kind,
  ProductSubcategoryId,
  SubcategoryRef,
  TransactionDirection,
} from "../categories/taxonomy";

const ACCOUNT_IDS = ["acc-1", "acc-2"];
const DATES = ["2026-09-24", "2026-09-25", "2026-09-26"];
const AMOUNTS = [0, 1000, 5000];
const CURRENCIES = ["BRL", "USD"];
const KINDS: (Kind | null)[] = [null, "income", "fixed", "variable", "transfer"];
const SUBCATEGORY_IDS: ProductSubcategoryId[] = ["food.groceries", "income.other"];

const subcategoryArb: fc.Arbitrary<SubcategoryRef | null> = fc.option(
  fc.constantFrom(...SUBCATEGORY_IDS).map((id): SubcategoryRef => ({ type: "product", id })),
  { nil: null },
);

const occurredAtArb: fc.Arbitrary<Date | null> = fc.option(
  fc.integer({ min: 0, max: 48 }).map((hours) => new Date(Date.UTC(2026, 8, 25, hours))),
  { nil: null },
);

const baseTransactionArb = fc.record({
  accountId: fc.constantFrom(...ACCOUNT_IDS),
  date: fc.constantFrom(...DATES),
  occurredAt: occurredAtArb,
  amountCentavos: fc.constantFrom(...AMOUNTS),
  currency: fc.constantFrom(...CURRENCIES),
  type: fc.constantFrom<TransactionDirection>("credit", "debit"),
  subcategory: subcategoryArb,
  kind: fc.constantFrom(...KINDS),
  isInternalTransfer: fc.boolean(),
  isLinked: fc.boolean(),
});

const transactionsArb: fc.Arbitrary<LinkableTransaction[]> = fc
  .array(baseTransactionArb, { maxLength: 8 })
  .map((items) => items.map((item, index) => ({ ...item, id: `t${String(index)}` })));

const dismissedArb: fc.Arbitrary<{ debitTransactionId: string; creditTransactionId: string }[]> =
  fc.array(
    fc.record({
      debitTransactionId: fc.constantFrom("t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"),
      creditTransactionId: fc.constantFrom("t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"),
    }),
    { maxLength: 6 },
  );

// Every transaction shares one bucket (account, day, currency, amount), so
// every debit is a candidate edge against every credit: the densest case for
// compareEdges, where a known date gap most often competes with an unknown
// one for the same transaction.
const sameBucketTransactionsArb: fc.Arbitrary<LinkableTransaction[]> = fc
  .array(
    fc.record({
      occurredAt: occurredAtArb,
      type: fc.constantFrom<TransactionDirection>("credit", "debit"),
      kind: fc.constantFrom(...KINDS),
      subcategory: subcategoryArb,
      isInternalTransfer: fc.boolean(),
      isLinked: fc.boolean(),
    }),
    { minLength: 2, maxLength: 8 },
  )
  .map((items) =>
    items.map((item, index) => ({
      ...item,
      id: `t${String(index)}`,
      accountId: "acc-1",
      date: "2026-09-25",
      amountCentavos: 5000,
      currency: "BRL",
    })),
  );

function sameSubcategory(a: SubcategoryRef | null, b: SubcategoryRef | null): boolean {
  if (a === null || b === null) return false;
  return a.type === b.type && a.id === b.id;
}

describe("suggestLinks property tests", () => {
  it("never puts a transaction in two suggestions", () => {
    fc.assert(
      fc.property(transactionsArb, dismissedArb, (transactions, dismissed) => {
        const links = suggestLinks(transactions, dismissed);
        const used = new Set<string>();
        for (const link of links) {
          expect(used.has(link.debitTransactionId)).toBe(false);
          expect(used.has(link.creditTransactionId)).toBe(false);
          used.add(link.debitTransactionId);
          used.add(link.creditTransactionId);
        }
      }),
    );
  });

  it("is independent of the input order", () => {
    fc.assert(
      fc.property(transactionsArb, dismissedArb, (transactions, dismissed) => {
        const forward = suggestLinks(transactions, dismissed);
        const reversed = suggestLinks([...transactions].reverse(), dismissed);
        expect(reversed).toEqual(forward);
      }),
    );
  });

  // occurredAt is randomly null in baseTransactionArb, so this also covers
  // the case where a known date gap competes with an unknown one: that must
  // not make compareEdges intransitive, which would make the result depend
  // on the order the input happened to arrive in.
  it("is independent of the input order even when some candidates have no occurredAt", () => {
    fc.assert(
      fc.property(
        sameBucketTransactionsArb.chain((transactions) =>
          fc.tuple(
            fc.constant(transactions),
            fc.shuffledSubarray(transactions, {
              minLength: transactions.length,
              maxLength: transactions.length,
            }),
          ),
        ),
        dismissedArb,
        ([transactions, shuffled], dismissed) => {
          const original = suggestLinks(transactions, dismissed);
          const reshuffled = suggestLinks(shuffled, dismissed);
          expect(new Set(reshuffled.map((link) => JSON.stringify(link)))).toEqual(
            new Set(original.map((link) => JSON.stringify(link))),
          );
        },
      ),
      { numRuns: 500 },
    );
  });

  it("returns only pairs that satisfy the suggestion rule", () => {
    fc.assert(
      fc.property(transactionsArb, dismissedArb, (transactions, dismissed) => {
        const byId = new Map(transactions.map((transaction) => [transaction.id, transaction]));
        const dismissedKeys = new Set(
          dismissed.map((pair) => `${pair.debitTransactionId}:${pair.creditTransactionId}`),
        );
        const links = suggestLinks(transactions, dismissed);

        for (const link of links) {
          const debit = byId.get(link.debitTransactionId);
          const credit = byId.get(link.creditTransactionId);
          if (!debit || !credit) throw new Error("link references an unknown transaction");

          expect(debit.type).toBe("debit");
          expect(credit.type).toBe("credit");
          expect(debit.accountId).toBe(credit.accountId);
          expect(debit.currency).toBe(credit.currency);
          expect(debit.date).toBe(credit.date);
          expect(Math.abs(debit.amountCentavos)).toBeGreaterThan(0);
          expect(Math.abs(debit.amountCentavos)).toBe(Math.abs(credit.amountCentavos));
          expect(debit.isInternalTransfer).toBe(false);
          expect(credit.isInternalTransfer).toBe(false);
          expect(debit.isLinked).toBe(false);
          expect(credit.isLinked).toBe(false);
          expect(sameSubcategory(debit.subcategory, credit.subcategory)).toBe(false);
          expect(dismissedKeys.has(`${debit.id}:${credit.id}`)).toBe(false);

          const neitherIsTransferOnItsOwn = debit.kind !== "transfer" && credit.kind !== "transfer";
          expect(link.kind).toBe(neitherIsTransferOnItsOwn ? "offset" : "funding");
        }
      }),
    );
  });
});
