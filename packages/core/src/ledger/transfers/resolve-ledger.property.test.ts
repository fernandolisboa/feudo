import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { KindContext } from "../categories/kinds";
import type { TransactionDirection } from "../categories/taxonomy";
import type { TransactionLink, TransactionLinkKind } from "./links";
import {
  resolveLedger,
  type LedgerAccountType,
  type LedgerContext,
  type LedgerTransaction,
  type TransactionLinkRef,
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
  counterpartType: fc.constant<"cpf" | "cnpj" | null>(null),
  accountHolderDocumentHash: fc.constant<string | null>(null),
  description: fc.constantFrom(...DESCRIPTIONS),
  providerCategory: fc.constant<string | null>(null),
  manual: fc.constant<LedgerTransaction["manual"]>(null),
  transferMark: fc.constantFrom<boolean | null>(true, false, null),
});

const transactionsArb: fc.Arbitrary<LedgerTransaction[]> = fc
  .array(baseTransactionArb, { maxLength: 8 })
  .map((items) => items.map((item, index) => ({ ...item, id: `t${String(index)}` })));

const emptyKinds: KindContext = { overrides: new Map(), householdSubcategories: new Map() };

function linksArbFor(transactions: readonly LedgerTransaction[]): fc.Arbitrary<TransactionLink[]> {
  const debitIds = transactions.filter((t) => t.type === "debit").map((t) => t.id);
  const creditIds = transactions.filter((t) => t.type === "credit").map((t) => t.id);
  if (debitIds.length === 0 || creditIds.length === 0) return fc.constant([]);
  return fc.array(
    fc.record({
      debitTransactionId: fc.constantFrom(...debitIds),
      creditTransactionId: fc.constantFrom(...creditIds),
      kind: fc.constantFrom<TransactionLinkKind>("offset", "funding"),
    }),
    { maxLength: 4 },
  );
}

const scenarioArb: fc.Arbitrary<{ transactions: LedgerTransaction[]; links: TransactionLink[] }> =
  transactionsArb.chain((transactions) =>
    linksArbFor(transactions).map((links) => ({ transactions, links })),
  );

function expectedLinkById(
  links: readonly TransactionLink[],
): ReadonlyMap<string, TransactionLinkRef> {
  const byId = new Map<string, TransactionLinkRef>();
  for (const link of links) {
    byId.set(link.debitTransactionId, { counterpartId: link.creditTransactionId, kind: link.kind });
    byId.set(link.creditTransactionId, { counterpartId: link.debitTransactionId, kind: link.kind });
  }
  return byId;
}

function contextWithLinks(links: readonly TransactionLink[]): LedgerContext {
  return { rules: [], kinds: emptyKinds, holderDocumentHashes: new Set(), links };
}

const ledgerContext: LedgerContext = contextWithLinks([]);

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

  it("never lets automatic pairing claim a linked transaction", () => {
    fc.assert(
      fc.property(scenarioArb, ({ transactions, links }) => {
        const resolved = resolveLedger(transactions, contextWithLinks(links));
        const byId = new Map(resolved.map((item) => [item.id, item]));
        const linkById = expectedLinkById(links);
        for (const id of linkById.keys()) {
          expect(byId.get(id)?.internalTransfer?.source).not.toBe("pair");
        }
      }),
    );
  });

  it("forces an offset link's two legs into transfers.pass-through unless an internal-transfer mark overrides it", () => {
    fc.assert(
      fc.property(scenarioArb, ({ transactions, links }) => {
        const resolved = resolveLedger(transactions, contextWithLinks(links));
        const resolvedById = new Map(resolved.map((item) => [item.id, item]));
        const transactionById = new Map(transactions.map((item) => [item.id, item]));
        const linkById = expectedLinkById(links);

        for (const [id, linkRef] of linkById) {
          if (linkRef.kind !== "offset") continue;
          const original = transactionById.get(id);
          if (!original || original.transferMark !== null) continue;

          expect(resolvedById.get(id)?.kind).toBe("transfer");
          expect(resolvedById.get(id)?.categorization).toEqual({
            subcategory: { type: "product", id: "transfers.pass-through" },
            source: "internal_transfer",
            ruleId: null,
          });
        }
      }),
    );
  });
});
