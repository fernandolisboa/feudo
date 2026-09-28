import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { businessDaysBetween } from "./business-days";
import {
  MAX_TRANSFER_BUSINESS_DAYS,
  pairInternalTransfers,
  type CounterpartType,
  type PairableTransaction,
} from "./pairing";
import type { TransactionDirection } from "../categories/taxonomy";

const ACCOUNT_IDS = ["acc-1", "acc-2", "acc-3"];
const DATES = ["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-28"];
const AMOUNTS = [0, 1000, 5000, 10000];
const CURRENCIES = ["BRL", "USD"];
const HASHES = ["hash-a", "hash-b", "hash-c"];
const COUNTERPART_TYPES: CounterpartType[] = ["cpf", "cnpj"];

const baseTransactionArb = fc.record({
  accountId: fc.constantFrom(...ACCOUNT_IDS),
  date: fc.constantFrom(...DATES),
  amountCentavos: fc.constantFrom(...AMOUNTS),
  currency: fc.constantFrom(...CURRENCIES),
  type: fc.constantFrom<TransactionDirection>("credit", "debit"),
  counterpartDocumentHash: fc.option(fc.constantFrom(...HASHES), { nil: null }),
  counterpartType: fc.option(fc.constantFrom(...COUNTERPART_TYPES), { nil: null }),
});

// One holder hash per account for the whole run (design contract's #16
// review round 3, item 6): an account's own holder never disagrees between
// two of its transactions, so the generator must not let it.
const accountHolderMapArb: fc.Arbitrary<ReadonlyMap<string, string | null>> = fc
  .tuple(...ACCOUNT_IDS.map(() => fc.option(fc.constantFrom(...HASHES), { nil: null })))
  .map((hashes) => new Map(ACCOUNT_IDS.map((id, index) => [id, hashes[index] ?? null])));

const transactionsArb: fc.Arbitrary<PairableTransaction[]> = fc
  .tuple(fc.array(baseTransactionArb, { maxLength: 8 }), accountHolderMapArb)
  .map(([items, holderByAccount]) =>
    items.map((item, index) => ({
      ...item,
      id: `t${String(index)}`,
      accountHolderDocumentHash: holderByAccount.get(item.accountId) ?? null,
    })),
  );

const holdersArb = fc.subarray([...HASHES]).map((hashes) => new Set(hashes) as ReadonlySet<string>);

type LegEvidence = "confirms" | "rejects" | "none";

// An oracle kept independent of pairing.ts's own legEvidence (design
// contract's #16 review round 2, item 3): a lookup table built straight from
// the five boolean facts the prose rule turns on, rather than the same
// nested-if shape the implementation uses, so a bug shared by both would
// still show up as a property failure.
type EvidenceCase = {
  hashPresent: boolean;
  otherHolderKnown: boolean;
  matchesOtherHolder: boolean;
  isCpf: boolean;
  inHouseholdSet: boolean;
};

const EVIDENCE_TABLE: { when: Partial<EvidenceCase>; result: LegEvidence }[] = [
  { when: { hashPresent: false }, result: "none" },
  { when: { otherHolderKnown: true, matchesOtherHolder: true }, result: "confirms" },
  { when: { otherHolderKnown: true, isCpf: false }, result: "none" },
  { when: { otherHolderKnown: true, isCpf: true, inHouseholdSet: true }, result: "none" },
  { when: { otherHolderKnown: true, isCpf: true, inHouseholdSet: false }, result: "rejects" },
  { when: { otherHolderKnown: false, inHouseholdSet: true }, result: "confirms" },
  { when: { otherHolderKnown: false, inHouseholdSet: false }, result: "none" },
];

function matches(when: Partial<EvidenceCase>, candidate: EvidenceCase): boolean {
  return (Object.keys(when) as (keyof EvidenceCase)[]).every((key) => when[key] === candidate[key]);
}

function decisionTableEvidence(candidate: EvidenceCase): LegEvidence {
  const row = EVIDENCE_TABLE.find((entry) => matches(entry.when, candidate));
  if (!row) {
    throw new Error("no decision-table row matches this evidence case");
  }
  return row.result;
}

function legEvidence(
  leg: PairableTransaction,
  otherAccountHolderHash: string | null,
  holderDocumentHashes: ReadonlySet<string>,
): LegEvidence {
  const h = leg.counterpartDocumentHash;
  return decisionTableEvidence({
    hashPresent: h !== null,
    otherHolderKnown: otherAccountHolderHash !== null,
    matchesOtherHolder: h !== null && h === otherAccountHolderHash,
    isCpf: leg.counterpartType === "cpf",
    inHouseholdSet: h !== null && holderDocumentHashes.has(h),
  });
}

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

          const debitEvidence = legEvidence(debit, credit.accountHolderDocumentHash, holders);
          const creditEvidence = legEvidence(credit, debit.accountHolderDocumentHash, holders);
          expect(debitEvidence).not.toBe("rejects");
          expect(creditEvidence).not.toBe("rejects");
          expect(pair.confirmed).toBe(
            debitEvidence === "confirms" || creditEvidence === "confirms",
          );
        }
      }),
    );
  });
});
