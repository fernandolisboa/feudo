import { describe, expect, it } from "vitest";
import { suggestLinks, type LinkableTransaction } from "./links";

function transaction(overrides: Partial<LinkableTransaction> = {}): LinkableTransaction {
  return {
    id: "t1",
    accountId: "checking-1",
    date: "2026-09-25",
    occurredAt: null,
    amountCentavos: 50000,
    currency: "BRL",
    type: "debit",
    subcategory: null,
    kind: null,
    isInternalTransfer: false,
    isLinked: false,
    ...overrides,
  };
}

describe("suggestLinks", () => {
  it("suggests an offset link when neither side resolves to kind transfer on its own", () => {
    const debit = transaction({ id: "d1", type: "debit" });
    const credit = transaction({ id: "c1", type: "credit" });
    expect(suggestLinks([debit, credit], [])).toEqual([
      { debitTransactionId: "d1", creditTransactionId: "c1", kind: "offset" },
    ]);
  });

  it("suggests a funding link when either side already resolves to kind transfer", () => {
    const debit = transaction({ id: "d1", type: "debit", kind: "transfer" });
    const credit = transaction({ id: "c1", type: "credit" });
    expect(suggestLinks([debit, credit], [])).toEqual([
      { debitTransactionId: "d1", creditTransactionId: "c1", kind: "funding" },
    ]);
  });

  it("never suggests legs of different accounts", () => {
    const debit = transaction({ id: "d1", accountId: "checking-1", type: "debit" });
    const credit = transaction({ id: "c1", accountId: "checking-2", type: "credit" });
    expect(suggestLinks([debit, credit], [])).toEqual([]);
  });

  it("never suggests legs of different currencies", () => {
    const debit = transaction({ id: "d1", currency: "BRL", type: "debit" });
    const credit = transaction({ id: "c1", currency: "USD", type: "credit" });
    expect(suggestLinks([debit, credit], [])).toEqual([]);
  });

  it("never suggests legs of different absolute amounts", () => {
    const debit = transaction({ id: "d1", amountCentavos: 50000, type: "debit" });
    const credit = transaction({ id: "c1", amountCentavos: 50001, type: "credit" });
    expect(suggestLinks([debit, credit], [])).toEqual([]);
  });

  it("never suggests legs on different household-local days", () => {
    const debit = transaction({ id: "d1", date: "2026-09-25", type: "debit" });
    const credit = transaction({ id: "c1", date: "2026-09-26", type: "credit" });
    expect(suggestLinks([debit, credit], [])).toEqual([]);
  });

  it("never suggests a zero-amount pair", () => {
    const debit = transaction({ id: "d1", amountCentavos: 0, type: "debit" });
    const credit = transaction({ id: "c1", amountCentavos: 0, type: "credit" });
    expect(suggestLinks([debit, credit], [])).toEqual([]);
  });

  it("never suggests a transaction that is already an internal transfer", () => {
    const debit = transaction({ id: "d1", type: "debit", isInternalTransfer: true });
    const credit = transaction({ id: "c1", type: "credit" });
    expect(suggestLinks([debit, credit], [])).toEqual([]);
  });

  it("never suggests a transaction that is already linked", () => {
    const debit = transaction({ id: "d1", type: "debit", isLinked: true });
    const credit = transaction({ id: "c1", type: "credit" });
    expect(suggestLinks([debit, credit], [])).toEqual([]);
  });

  it("never suggests a pair the household dismissed", () => {
    const debit = transaction({ id: "d1", type: "debit" });
    const credit = transaction({ id: "c1", type: "credit" });
    expect(
      suggestLinks([debit, credit], [{ debitTransactionId: "d1", creditTransactionId: "c1" }]),
    ).toEqual([]);
  });

  it("never suggests a pair that already resolves to the same subcategory", () => {
    const sameSubcategory = { type: "product" as const, id: "food.groceries" as const };
    const debit = transaction({ id: "d1", type: "debit", subcategory: sameSubcategory });
    const credit = transaction({ id: "c1", type: "credit", subcategory: sameSubcategory });
    expect(suggestLinks([debit, credit], [])).toEqual([]);
  });

  it("suggests a pair whose two sides resolve to different subcategories", () => {
    const debit = transaction({
      id: "d1",
      type: "debit",
      subcategory: { type: "product", id: "food.groceries" },
    });
    const credit = transaction({
      id: "c1",
      type: "credit",
      subcategory: { type: "product", id: "income.other" },
    });
    expect(suggestLinks([debit, credit], [])).toEqual([
      { debitTransactionId: "d1", creditTransactionId: "c1", kind: "offset" },
    ]);
  });

  it("gives each transaction at most one suggestion", () => {
    const debit = transaction({ id: "d1", type: "debit" });
    const creditA = transaction({ id: "c-a", type: "credit" });
    const creditB = transaction({ id: "c-b", type: "credit" });
    const links = suggestLinks([debit, creditA, creditB], []);
    expect(links).toHaveLength(1);
  });

  it("prefers the candidate closest in occurredAt when both legs have one", () => {
    const debit = transaction({ id: "d1", occurredAt: new Date("2026-09-25T12:00:00Z") });
    const far = transaction({
      id: "c-far",
      type: "credit",
      occurredAt: new Date("2026-09-25T20:00:00Z"),
    });
    const close = transaction({
      id: "c-close",
      type: "credit",
      occurredAt: new Date("2026-09-25T12:05:00Z"),
    });
    expect(suggestLinks([debit, far, close], [])).toEqual([
      { debitTransactionId: "d1", creditTransactionId: "c-close", kind: "offset" },
    ]);
  });

  it("breaks ties by id when occurredAt cannot settle them", () => {
    const debit = transaction({ id: "d1", occurredAt: null });
    const creditA = transaction({ id: "c-a", type: "credit", occurredAt: null });
    const creditB = transaction({ id: "c-b", type: "credit", occurredAt: null });
    expect(suggestLinks([debit, creditB, creditA], [])).toEqual([
      { debitTransactionId: "d1", creditTransactionId: "c-a", kind: "offset" },
    ]);
  });

  it("is independent of input order", () => {
    const debit = transaction({ id: "d1" });
    const credit = transaction({ id: "c1", type: "credit" });
    expect(suggestLinks([credit, debit], [])).toEqual(suggestLinks([debit, credit], []));
  });

  // debits q and b both have a known occurredAt gap to credits cq and cb,
  // debit m has none. Mixing "both legs known" (sorted by gap) with "at
  // least one leg unknown" (sorted by id) made compareEdges intransitive:
  // these three orderings of the exact same five transactions used to
  // return three different pairings. The correct, order-independent answer
  // takes the closest known gap first (q-cq, 1h), then the next closest
  // (b-cb, 10h); m is left over with no credit.
  it("orders edges with a known date gap before edges without one, consistently across input orders", () => {
    const q = transaction({ id: "q", occurredAt: new Date("2026-09-25T00:00:00Z") });
    const b = transaction({ id: "b", occurredAt: new Date("2026-09-25T10:00:00Z") });
    const m = transaction({ id: "m", occurredAt: null });
    const cq = transaction({
      id: "cq",
      type: "credit",
      occurredAt: new Date("2026-09-25T01:00:00Z"),
    });
    const cb = transaction({
      id: "cb",
      type: "credit",
      occurredAt: new Date("2026-09-25T20:00:00Z"),
    });
    const expected = [
      { debitTransactionId: "b", creditTransactionId: "cb", kind: "offset" },
      { debitTransactionId: "q", creditTransactionId: "cq", kind: "offset" },
    ];

    expect(suggestLinks([q, b, m, cq, cb], [])).toEqual(expected);
    expect(suggestLinks([q, m, b, cq, cb], [])).toEqual(expected);
    expect(suggestLinks([b, m, q, cq, cb], [])).toEqual(expected);
  });
});
