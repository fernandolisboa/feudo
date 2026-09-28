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
};

export type InternalTransfer =
  { source: "mark" } | { source: "pair"; counterpartId: string; confirmed: boolean };

export type ResolvedTransaction = {
  id: string;
  categorization: Categorization | null;
  kind: Kind | null;
  internalTransfer: InternalTransfer | null;
};

type PairInfo = { counterpartId: string; confirmed: boolean };

function toCategorizable(transaction: LedgerTransaction): CategorizableTransaction {
  return {
    description: transaction.description,
    type: transaction.type,
    providerCategory: transaction.providerCategory,
    manual: transaction.manual,
  };
}

function isPairingCandidate(transaction: LedgerTransaction, kinds: KindContext): boolean {
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
): ResolvedTransaction {
  const base = categorize(toCategorizable(transaction), orderedRules);

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
    };
  }

  if (transaction.transferMark === false) {
    if (base !== null && kindOf(base.subcategory, context.kinds) === "transfer") {
      return { id: transaction.id, categorization: null, kind: null, internalTransfer: null };
    }
    return {
      id: transaction.id,
      categorization: base,
      kind: base ? kindOf(base.subcategory, context.kinds) : null,
      internalTransfer: null,
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
    };
  }

  return {
    id: transaction.id,
    categorization: base,
    kind: base ? kindOf(base.subcategory, context.kinds) : null,
    internalTransfer: null,
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

  const pairablePool = transactions.filter((transaction) =>
    isPairingCandidate(transaction, context.kinds),
  );
  const pairs = pairInternalTransfers(pairablePool, context.holderDocumentHashes);

  const pairById = new Map<string, PairInfo>();
  for (const pair of pairs) {
    pairById.set(pair.debitId, { counterpartId: pair.creditId, confirmed: pair.confirmed });
    pairById.set(pair.creditId, { counterpartId: pair.debitId, confirmed: pair.confirmed });
  }

  return transactions.map((transaction) =>
    resolveTransaction(transaction, context, orderedRules, pairById, accountTypeById),
  );
}
