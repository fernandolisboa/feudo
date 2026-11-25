import {
  categorize,
  orderRules,
  type CategorizableTransaction,
  type CategorizationRule,
  type Categorization,
} from "../categories/categorize";
import { kindOf, type KindContext } from "../categories/kinds";
import type { Kind, ProductSubcategoryId, SubcategoryRef } from "../categories/taxonomy";
import { pairInternalTransfers, type PairableTransaction } from "./pairing";
import type { TransactionLink, TransactionLinkKind } from "./links";

export type LedgerAccountType = "checking" | "savings" | "credit_card" | "investment";

export type LedgerTransaction = PairableTransaction & {
  accountType: LedgerAccountType;
  description: string;
  providerCategory: string | null;
  manual: SubcategoryRef | null;
  transferMark: boolean | null;
};

export type LedgerContext = {
  rules: readonly CategorizationRule[];
  kinds: KindContext;
  holderDocumentHashes: ReadonlySet<string>;
  links: readonly TransactionLink[];
};

export type InternalTransfer =
  { source: "mark" } | { source: "pair"; counterpartId: string; confirmed: boolean };

export type TransactionLinkRef = { counterpartId: string; kind: TransactionLinkKind };

export type ResolvedTransaction = {
  id: string;
  categorization: Categorization | null;
  kind: Kind | null;
  internalTransfer: InternalTransfer | null;
  link: TransactionLinkRef | null;
};

type PairInfo = { counterpartId: string; confirmed: boolean };

const PASS_THROUGH_SUBCATEGORY: ProductSubcategoryId = "transfers.pass-through";

function offsetLinkCategorization(): Categorization {
  return {
    subcategory: { type: "product", id: PASS_THROUGH_SUBCATEGORY },
    source: "link",
    ruleId: null,
  };
}

function linkRefsById(links: readonly TransactionLink[]): ReadonlyMap<string, TransactionLinkRef> {
  const byId = new Map<string, TransactionLinkRef>();
  for (const link of links) {
    byId.set(link.debitTransactionId, { counterpartId: link.creditTransactionId, kind: link.kind });
    byId.set(link.creditTransactionId, { counterpartId: link.debitTransactionId, kind: link.kind });
  }
  return byId;
}

function toCategorizable(transaction: LedgerTransaction): CategorizableTransaction {
  return {
    description: transaction.description,
    type: transaction.type,
    amountCentavos: transaction.amountCentavos,
    currency: transaction.currency,
    providerCategory: transaction.providerCategory,
    manual: transaction.manual,
  };
}

function isPairingCandidate(
  transaction: LedgerTransaction,
  kinds: KindContext,
  linkedIds: ReadonlySet<string>,
): boolean {
  if (linkedIds.has(transaction.id)) return false;
  if (transaction.transferMark === false) return false;
  if (transaction.transferMark === true) return true;
  if (transaction.manual !== null && kindOf(transaction.manual, kinds) !== "transfer") return false;
  return true;
}

function internalTransferSubcategoryId(
  ownAccountType: LedgerAccountType,
  counterpartAccountType: LedgerAccountType | null,
): ProductSubcategoryId {
  const isCardBill = ownAccountType === "credit_card" || counterpartAccountType === "credit_card";
  return isCardBill ? "transfers.card-bill" : "transfers.own-accounts";
}

function internalTransferCategorization(
  base: Categorization | null,
  ownAccountType: LedgerAccountType,
  counterpartAccountType: LedgerAccountType | null,
  kinds: KindContext,
): Categorization {
  if (base !== null && kindOf(base.subcategory, kinds) === "transfer") {
    return base;
  }
  return {
    subcategory: {
      type: "product",
      id: internalTransferSubcategoryId(ownAccountType, counterpartAccountType),
    },
    source: "internal_transfer",
    ruleId: null,
  };
}

function resolveTransaction(
  transaction: LedgerTransaction,
  context: LedgerContext,
  orderedRules: readonly CategorizationRule[],
  pairById: ReadonlyMap<string, PairInfo>,
  accountTypeById: ReadonlyMap<string, LedgerAccountType>,
  linkById: ReadonlyMap<string, TransactionLinkRef>,
): ResolvedTransaction {
  const base = categorize(toCategorizable(transaction), orderedRules);
  const link = linkById.get(transaction.id) ?? null;

  if (transaction.transferMark === true) {
    const pair = pairById.get(transaction.id) ?? null;
    const counterpartAccountType = pair ? (accountTypeById.get(pair.counterpartId) ?? null) : null;
    return {
      id: transaction.id,
      categorization: internalTransferCategorization(
        base,
        transaction.accountType,
        counterpartAccountType,
        context.kinds,
      ),
      kind: "transfer",
      internalTransfer: { source: "mark" },
      link,
    };
  }

  // Checked before the false-mark branch below (review round 1, finding
  // B2): a mark of false only says "do not pair this as an internal
  // transfer," not "never force this into transfer." A confirmed offset
  // link still wins for a leg marked false, so only a mark of true (above)
  // outranks it.
  if (link !== null && link.kind === "offset") {
    return {
      id: transaction.id,
      categorization: offsetLinkCategorization(),
      kind: "transfer",
      internalTransfer: null,
      link,
    };
  }

  if (transaction.transferMark === false) {
    if (base !== null && kindOf(base.subcategory, context.kinds) === "transfer") {
      return {
        id: transaction.id,
        categorization: null,
        kind: null,
        internalTransfer: null,
        link,
      };
    }
    return {
      id: transaction.id,
      categorization: base,
      kind: base ? kindOf(base.subcategory, context.kinds) : null,
      internalTransfer: null,
      link,
    };
  }

  const pair = pairById.get(transaction.id);
  if (pair) {
    const counterpartAccountType = accountTypeById.get(pair.counterpartId) ?? null;
    return {
      id: transaction.id,
      categorization: internalTransferCategorization(
        base,
        transaction.accountType,
        counterpartAccountType,
        context.kinds,
      ),
      kind: "transfer",
      internalTransfer: {
        source: "pair",
        counterpartId: pair.counterpartId,
        confirmed: pair.confirmed,
      },
      link,
    };
  }

  return {
    id: transaction.id,
    categorization: base,
    kind: base ? kindOf(base.subcategory, context.kinds) : null,
    internalTransfer: null,
    link,
  };
}

export function resolveLedger(
  transactions: readonly LedgerTransaction[],
  context: LedgerContext,
): ResolvedTransaction[] {
  const orderedRules = orderRules(context.rules);
  const accountTypeById = new Map(
    transactions.map((transaction) => [transaction.id, transaction.accountType]),
  );

  const transactionIds = new Set(transactions.map((transaction) => transaction.id));
  const validLinks = context.links.filter(
    (link) =>
      transactionIds.has(link.debitTransactionId) && transactionIds.has(link.creditTransactionId),
  );
  const linkById = linkRefsById(validLinks);
  const linkedIds = new Set(linkById.keys());

  const pairablePool = transactions.filter((transaction) =>
    isPairingCandidate(transaction, context.kinds, linkedIds),
  );
  const pairs = pairInternalTransfers(pairablePool, context.holderDocumentHashes);

  const pairById = new Map<string, PairInfo>();
  for (const pair of pairs) {
    pairById.set(pair.debitId, { counterpartId: pair.creditId, confirmed: pair.confirmed });
    pairById.set(pair.creditId, { counterpartId: pair.debitId, confirmed: pair.confirmed });
  }

  return transactions.map((transaction) =>
    resolveTransaction(transaction, context, orderedRules, pairById, accountTypeById, linkById),
  );
}
