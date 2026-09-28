import { describe, expect, it } from "vitest";
import { pairInternalTransfers, type PairableTransaction } from "./pairing";

function transaction(overrides: Partial<PairableTransaction> = {}): PairableTransaction {
  return {
    id: "t1",
    accountId: "checking-1",
    date: "2026-09-25",
    amountCentavos: 50000,
    currency: "BRL",
    type: "debit",
    counterpartDocumentHash: null,
    ...overrides,
  };
}

describe("pairInternalTransfers", () => {
  it("rejects a candidate whose counterpart document hash is present but not a household holder", () => {
    const debit = transaction({
      id: "d1",
      type: "debit",
      counterpartDocumentHash: "hash-stranger",
    });
    const credit = transaction({ id: "c1", accountId: "card-1", type: "credit" });
    const pairs = pairInternalTransfers([debit, credit], new Set(["hash-a"]));
    expect(pairs).toEqual([]);
  });

  it("confirms a pair when only one side carries a matching hash", () => {
    const debit = transaction({ id: "d1", type: "debit" });
    const credit = transaction({
      id: "c1",
      accountId: "card-1",
      type: "credit",
      counterpartDocumentHash: "hash-a",
    });
    const pairs = pairInternalTransfers([debit, credit], new Set(["hash-a"]));
    expect(pairs).toEqual([{ debitId: "d1", creditId: "c1", confirmed: true }]);
  });

  it("pairs unconfirmed when neither side carries a document hash", () => {
    const debit = transaction({ id: "d1", type: "debit" });
    const credit = transaction({ id: "c1", accountId: "card-1", type: "credit" });
    const pairs = pairInternalTransfers([debit, credit], new Set());
    expect(pairs).toEqual([{ debitId: "d1", creditId: "c1", confirmed: false }]);
  });

  it("never pairs two legs of the same account", () => {
    const debit = transaction({ id: "d1", accountId: "checking-1", type: "debit" });
    const credit = transaction({ id: "c1", accountId: "checking-1", type: "credit" });
    const pairs = pairInternalTransfers([debit, credit], new Set());
    expect(pairs).toEqual([]);
  });

  it("never pairs legs in different currencies", () => {
    const debit = transaction({ id: "d1", currency: "BRL", type: "debit" });
    const credit = transaction({ id: "c1", accountId: "card-1", currency: "USD", type: "credit" });
    const pairs = pairInternalTransfers([debit, credit], new Set());
    expect(pairs).toEqual([]);
  });

  it("never pairs legs more than two business days apart", () => {
    const debit = transaction({ id: "d1", date: "2026-09-23", type: "debit" });
    const credit = transaction({
      id: "c1",
      accountId: "card-1",
      date: "2026-09-28",
      type: "credit",
    });
    expect(pairInternalTransfers([debit, credit], new Set())).toEqual([]);
  });

  it("pairs legs from Friday to the following Tuesday, two business days apart", () => {
    const debit = transaction({ id: "d1", date: "2026-09-25", type: "debit" });
    const credit = transaction({
      id: "c1",
      accountId: "card-1",
      date: "2026-09-29",
      type: "credit",
    });
    expect(pairInternalTransfers([debit, credit], new Set())).toEqual([
      { debitId: "d1", creditId: "c1", confirmed: false },
    ]);
  });

  it("never pairs zero-amount legs", () => {
    const debit = transaction({ id: "d1", amountCentavos: 0, type: "debit" });
    const credit = transaction({
      id: "c1",
      accountId: "card-1",
      amountCentavos: 0,
      type: "credit",
    });
    expect(pairInternalTransfers([debit, credit], new Set())).toEqual([]);
  });

  it("prefers a confirmed edge over a closer unconfirmed one for the same debit", () => {
    const debit = transaction({ id: "d1", date: "2026-09-25", type: "debit" });
    const sameDayUnconfirmed = transaction({
      id: "c-same-day",
      accountId: "card-1",
      date: "2026-09-25",
      type: "credit",
    });
    const nextDayConfirmed = transaction({
      id: "c-next-day",
      accountId: "card-2",
      date: "2026-09-28",
      type: "credit",
      counterpartDocumentHash: "hash-a",
    });
    const pairs = pairInternalTransfers(
      [debit, sameDayUnconfirmed, nextDayConfirmed],
      new Set(["hash-a"]),
    );
    expect(pairs).toEqual([{ debitId: "d1", creditId: "c-next-day", confirmed: true }]);
  });

  it("breaks ties between equally ranked candidates by debit id", () => {
    const debitA = transaction({
      id: "d-a",
      accountId: "checking-1",
      date: "2026-09-25",
      type: "debit",
    });
    const debitB = transaction({
      id: "d-b",
      accountId: "checking-2",
      date: "2026-09-25",
      type: "debit",
    });
    const credit = transaction({
      id: "c1",
      accountId: "card-1",
      date: "2026-09-25",
      type: "credit",
    });
    const pairs = pairInternalTransfers([debitB, credit, debitA], new Set());
    expect(pairs).toEqual([{ debitId: "d-a", creditId: "c1", confirmed: false }]);
  });

  it("sorts the result by debit id", () => {
    const debitA = transaction({ id: "d-a", accountId: "checking-1", type: "debit" });
    const debitB = transaction({ id: "d-b", accountId: "checking-2", type: "debit" });
    const creditA = transaction({ id: "c-a", accountId: "card-1", type: "credit" });
    const creditB = transaction({ id: "c-b", accountId: "card-2", type: "credit" });
    const pairs = pairInternalTransfers([debitB, creditB, debitA, creditA], new Set());
    expect(pairs.map((pair) => pair.debitId)).toEqual(["d-a", "d-b"]);
  });
});
