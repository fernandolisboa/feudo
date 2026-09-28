import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { KindContext } from "../categories/kinds";
import type { TransactionDirection } from "../categories/taxonomy";
import {
  resolveLedger,
  type LedgerAccountType,
  type LedgerContext,
  type LedgerTransaction,
} from "./resolve-ledger";

const ACCOUNT_IDS = ["acc-1", "acc-2", "acc-3"];
const ACCOUNT_TYPES: LedgerAccountType[] = ["checking", "savings", "credit_card", "investment"];
const DATES = ["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-28"];
const AMOUNTS = [0, 1000, 5000, 10000];
const DESCRIPTIONS = ["COMPRA CARTAO MERCADO", "PAGAMENTO FATURA CARTAO", "PIX RECEBIDO"];

const baseTransactionArb = fc.record({
  accountId: fc.constantFrom(...ACCOUNT_IDS),
  accountType: fc.constantFrom(...ACCOUNT_TYPES),
  date: fc.constantFrom(...DATES),
  amountCentavos: fc.constantFrom(...AMOUNTS),
  currency: fc.constant("BRL"),
  type: fc.constantFrom<TransactionDirection>("credit", "debit"),
  counterpartDocumentHash: fc.constant<string | null>(null),
  description: fc.constantFrom(...DESCRIPTIONS),
  providerCategory: fc.constant<string | null>(null),
  manual: fc.constant<LedgerTransaction["manual"]>(null),
  transferMark: fc.constantFrom<boolean | null>(true, false, null),
});

const transactionsArb: fc.Arbitrary<LedgerTransaction[]> = fc
  .array(baseTransactionArb, { maxLength: 8 })
  .map((items) => items.map((item, index) => ({ ...item, id: `t${String(index)}` })));

const emptyKinds: KindContext = { overrides: new Map(), householdSubcategories: new Map() };
const ledgerContext: LedgerContext = {
  rules: [],
  kinds: emptyKinds,
  holderDocumentHashes: new Set(),
};

describe("resolveLedger property tests", () => {
  it("returns the same order and length as the input", () => {
    fc.assert(
      fc.property(transactionsArb, (transactions) => {
        const resolved = resolveLedger(transactions, ledgerContext);
        expect(resolved.map((item) => item.id)).toEqual(transactions.map((item) => item.id));
      }),
    );
  });

  it("never reports an internal transfer for a transaction marked false", () => {
    fc.assert(
      fc.property(transactionsArb, (transactions) => {
        const resolved = resolveLedger(transactions, ledgerContext);
        const byId = new Map(resolved.map((item) => [item.id, item]));
        for (const transaction of transactions) {
          if (transaction.transferMark === false) {
            expect(byId.get(transaction.id)?.internalTransfer).toBeNull();
          }
        }
      }),
    );
  });
});
