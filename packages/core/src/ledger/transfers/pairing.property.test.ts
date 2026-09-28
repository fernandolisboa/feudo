import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { businessDaysBetween } from "./business-days";
import {
  MAX_TRANSFER_BUSINESS_DAYS,
  pairInternalTransfers,
  type PairableTransaction,
} from "./pairing";
import type { TransactionDirection } from "../categories/taxonomy";

const ACCOUNT_IDS = ["acc-1", "acc-2", "acc-3"];
const DATES = ["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-28"];
const AMOUNTS = [0, 1000, 5000, 10000];
const CURRENCIES = ["BRL", "USD"];
const HASHES = ["hash-a", "hash-b", "hash-c"];

const baseTransactionArb = fc.record({
  accountId: fc.constantFrom(...ACCOUNT_IDS),
  date: fc.constantFrom(...DATES),
  amountCentavos: fc.constantFrom(...AMOUNTS),
  currency: fc.constantFrom(...CURRENCIES),
  type: fc.constantFrom<TransactionDirection>("credit", "debit"),
  counterpartDocumentHash: fc.option(fc.constantFrom(...HASHES), { nil: null }),
});

const transactionsArb: fc.Arbitrary<PairableTransaction[]> = fc
  .array(baseTransactionArb, { maxLength: 8 })
  .map((items) => items.map((item, index) => ({ ...item, id: `t${String(index)}` })));

const holdersArb = fc.subarray([...HASHES]).map((hashes) => new Set(hashes) as ReadonlySet<string>);

describe("pairInternalTransfers property tests", () => {
  it("never puts a transaction in two pairs", () => {
    fc.assert(
      fc.property(transactionsArb, holdersArb, (transactions, holders) => {
        const pairs = pairInternalTransfers(transactions, holders);
        const used = new Set<string>();
        for (const pair of pairs) {
          expect(used.has(pair.debitId)).toBe(false);
          expect(used.has(pair.creditId)).toBe(false);
          used.add(pair.debitId);
          used.add(pair.creditId);
        }
      }),
    );
  });

  it("is independent of the input order", () => {
    fc.assert(
      fc.property(transactionsArb, holdersArb, (transactions, holders) => {
        const forward = pairInternalTransfers(transactions, holders);
        const reversed = pairInternalTransfers([...transactions].reverse(), holders);
        expect(reversed).toEqual(forward);
      }),
    );
  });

  it("returns only pairs that satisfy the pair rule", () => {
    fc.assert(
      fc.property(transactionsArb, holdersArb, (transactions, holders) => {
        const byId = new Map(transactions.map((transaction) => [transaction.id, transaction]));
        const pairs = pairInternalTransfers(transactions, holders);
        for (const pair of pairs) {
          const debit = byId.get(pair.debitId);
          const credit = byId.get(pair.creditId);
          if (!debit || !credit) throw new Error("pair references an unknown transaction");

          expect(debit.type).toBe("debit");
          expect(credit.type).toBe("credit");
          expect(debit.accountId).not.toBe(credit.accountId);
          expect(debit.currency).toBe(credit.currency);
          expect(Math.abs(debit.amountCentavos)).toBeGreaterThan(0);
          expect(Math.abs(debit.amountCentavos)).toBe(Math.abs(credit.amountCentavos));
          expect(businessDaysBetween(debit.date, credit.date)).toBeLessThanOrEqual(
            MAX_TRANSFER_BUSINESS_DAYS,
          );

          const presentHashes = [
            debit.counterpartDocumentHash,
            credit.counterpartDocumentHash,
          ].filter((hash): hash is string => hash !== null);
          for (const hash of presentHashes) {
            expect(holders.has(hash)).toBe(true);
          }
          expect(pair.confirmed).toBe(presentHashes.length > 0);
        }
      }),
    );
  });
});
