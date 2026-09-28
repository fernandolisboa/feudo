import { describe, expect, it } from "vitest";
import { pairInternalTransfers, pairingReadRange, type PairableTransaction } from "./pairing";

function transaction(overrides: Partial<PairableTransaction> = {}): PairableTransaction {
  return {
    id: "t1",
    accountId: "checking-1",
    date: "2026-09-25",
    amountCentavos: 50000,
    currency: "BRL",
    type: "debit",
    counterpartDocumentHash: null,
    counterpartType: null,
    accountHolderDocumentHash: null,
    ...overrides,
  };
}

describe("pairInternalTransfers", () => {
  it("pairs unconfirmed when the counterpart's account carries no holder hash and the household set is empty", () => {
    const debit = transaction({
      id: "d1",
      type: "debit",
      counterpartDocumentHash: "hash-partner",
      counterpartType: "cpf",
    });
    const credit = transaction({
      id: "c1",
      accountId: "card-1",
      type: "credit",
      accountHolderDocumentHash: null,
    });
    const pairs = pairInternalTransfers([debit, credit], new Set());
    expect(pairs).toEqual([{ debitId: "d1", creditId: "c1", confirmed: false }]);
  });

  it("confirms when only one side carries a matching hash", () => {
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

  describe("per-leg counterpart-hash evidence (design contract's #16 review, item 2)", () => {
    it("pairs a partner account without a holder hash of its own as unconfirmed when its counterpart isn't a household holder either", () => {
      const debit = transaction({
        id: "d1",
        type: "debit",
        counterpartDocumentHash: "hash-partner",
        counterpartType: "cpf",
      });
      const credit = transaction({
        id: "c1",
        accountId: "checking-2",
        type: "credit",
        accountHolderDocumentHash: null,
      });
      expect(pairInternalTransfers([debit, credit], new Set())).toEqual([
        { debitId: "d1", creditId: "c1", confirmed: false },
      ]);
    });

    it("confirms via the household holder set when the counterpart's account carries no holder hash of its own", () => {
      const debit = transaction({
        id: "d1",
        type: "debit",
        counterpartDocumentHash: "hash-partner",
        counterpartType: "cpf",
      });
      const credit = transaction({
        id: "c1",
        accountId: "checking-2",
        type: "credit",
        accountHolderDocumentHash: null,
      });
      expect(pairInternalTransfers([debit, credit], new Set(["hash-partner"]))).toEqual([
        { debitId: "d1", creditId: "c1", confirmed: true },
      ]);
    });

    it("pairs a card bill paid to the issuer's CNPJ, which never matches the card account's own holder", () => {
      const debit = transaction({
        id: "d1",
        accountId: "checking-1",
        type: "debit",
        counterpartDocumentHash: "hash-issuer-cnpj",
        counterpartType: "cnpj",
      });
      const credit = transaction({
        id: "c1",
        accountId: "card-1",
        type: "credit",
        accountHolderDocumentHash: "hash-holder",
      });
      const pairs = pairInternalTransfers([debit, credit], new Set(["hash-holder"]));
      expect(pairs).toEqual([{ debitId: "d1", creditId: "c1", confirmed: false }]);
    });

    it("rejects when the debit's counterpart CPF is a known third person, not the credit account's own holder", () => {
      const debit = transaction({
        id: "d1",
        type: "debit",
        counterpartDocumentHash: "hash-stranger",
        counterpartType: "cpf",
      });
      const credit = transaction({
        id: "c1",
        accountId: "checking-2",
        type: "credit",
        accountHolderDocumentHash: "hash-holder",
      });
      expect(pairInternalTransfers([debit, credit], new Set(["hash-holder"]))).toEqual([]);
    });

    it("confirms when the debit's counterpart CPF matches the credit account's own holder", () => {
      const debit = transaction({
        id: "d1",
        type: "debit",
        counterpartDocumentHash: "hash-holder",
        counterpartType: "cpf",
      });
      const credit = transaction({
        id: "c1",
        accountId: "checking-2",
        type: "credit",
        accountHolderDocumentHash: "hash-holder",
      });
      expect(pairInternalTransfers([debit, credit], new Set(["hash-holder"]))).toEqual([
        { debitId: "d1", creditId: "c1", confirmed: true },
      ]);
    });

    it("rejects a CPF that is a household holder but not this specific counterpart's known holder", () => {
      const debit = transaction({
        id: "d1",
        type: "debit",
        counterpartDocumentHash: "hash-other-household-account",
        counterpartType: "cpf",
      });
      const credit = transaction({
        id: "c1",
        accountId: "checking-2",
        type: "credit",
        accountHolderDocumentHash: "hash-holder",
      });
      expect(
        pairInternalTransfers(
          [debit, credit],
          new Set(["hash-holder", "hash-other-household-account"]),
        ),
      ).toEqual([]);
    });

    it("rejects the candidate when either leg's evidence rejects, even if the other leg confirms", () => {
      const debit = transaction({
        id: "d1",
        type: "debit",
        counterpartDocumentHash: "hash-credit-holder",
        counterpartType: "cpf",
        accountHolderDocumentHash: "hash-debit-holder",
      });
      const credit = transaction({
        id: "c1",
        accountId: "checking-2",
        type: "credit",
        counterpartDocumentHash: "hash-stranger",
        counterpartType: "cpf",
        accountHolderDocumentHash: "hash-credit-holder",
      });
      expect(pairInternalTransfers([debit, credit], new Set())).toEqual([]);
    });
  });
});

describe("pairingReadRange", () => {
  it("pads a range by more than MAX_TRANSFER_BUSINESS_DAYS of calendar days", () => {
    const padded = pairingReadRange({ from: "2026-09-01", to: "2026-09-30" });
    expect(padded.from < "2026-09-01").toBe(true);
    expect(padded.to > "2026-09-30").toBe(true);
  });
});
