import type { Kind, SubcategoryRef, TransactionDirection } from "../categories/taxonomy";

export type TransactionLinkKind = "offset" | "funding";

export type TransactionLink = {
  debitTransactionId: string;
  creditTransactionId: string;
  kind: TransactionLinkKind;
};

export type LinkableTransaction = {
  id: string;
  accountId: string;
  date: string;
  occurredAt: Date | null;
  amountCentavos: number;
  currency: string;
  type: TransactionDirection;
  subcategory: SubcategoryRef | null;
  kind: Kind | null;
  isInternalTransfer: boolean;
  isLinked: boolean;
};

export type DismissedLinkPair = {
  debitTransactionId: string;
  creditTransactionId: string;
};

type CandidateEdge = {
  debit: LinkableTransaction;
  credit: LinkableTransaction;
  kind: TransactionLinkKind;
};

function sameSubcategory(a: SubcategoryRef | null, b: SubcategoryRef | null): boolean {
  if (a === null || b === null) return false;
  return a.type === b.type && a.id === b.id;
}

function bucketKey(transaction: LinkableTransaction): string {
  return [
    transaction.accountId,
    transaction.date,
    transaction.currency,
    String(Math.abs(transaction.amountCentavos)),
  ].join(":");
}

// Mirrors pairing.ts's creditsByMagnitude: a credit only ever edges with a
// debit sharing its account, day, currency and magnitude (candidateEdge's own
// first checks), so bucketing up front keeps each debit from scanning every
// credit in the input.
function creditsByBucket(
  credits: readonly LinkableTransaction[],
): Map<string, LinkableTransaction[]> {
  const buckets = new Map<string, LinkableTransaction[]>();
  for (const credit of credits) {
    const key = bucketKey(credit);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(credit);
    } else {
      buckets.set(key, [credit]);
    }
  }
  return buckets;
}

function candidateEdge(
  debit: LinkableTransaction,
  credit: LinkableTransaction,
): CandidateEdge | null {
  if (debit.isInternalTransfer || credit.isInternalTransfer) return null;
  if (debit.isLinked || credit.isLinked) return null;

  const magnitude = Math.abs(debit.amountCentavos);
  if (magnitude === 0) return null;

  if (sameSubcategory(debit.subcategory, credit.subcategory)) return null;

  const neitherIsTransferOnItsOwn = debit.kind !== "transfer" && credit.kind !== "transfer";
  return { debit, credit, kind: neitherIsTransferOnItsOwn ? "offset" : "funding" };
}

function occurredAtGapMs(edge: CandidateEdge): number | null {
  const { debit, credit } = edge;
  if (debit.occurredAt === null || credit.occurredAt === null) return null;
  return Math.abs(debit.occurredAt.getTime() - credit.occurredAt.getTime());
}

// A total order (review round 1, finding B1): comparing a known gap against
// bGap === null directly against an id comparison, with no regard for
// whether the *other* side of each comparison was itself known, made the
// relation intransitive (a < b and b < c could still leave c < a), which
// made suggestLinks depend on input order whenever some candidates had an
// occurredAt and others did not. Known-gap edges now always sort before
// unknown ones; id only breaks ties inside each of the two groups.
function compareEdges(a: CandidateEdge, b: CandidateEdge): number {
  const aGap = occurredAtGapMs(a);
  const bGap = occurredAtGapMs(b);
  if (aGap !== null && bGap === null) return -1;
  if (aGap === null && bGap !== null) return 1;
  if (aGap !== null && bGap !== null && aGap !== bGap) return aGap - bGap;
  if (a.debit.id !== b.debit.id) return a.debit.id < b.debit.id ? -1 : 1;
  if (a.credit.id !== b.credit.id) return a.credit.id < b.credit.id ? -1 : 1;
  return 0;
}

function dismissedKey(debitTransactionId: string, creditTransactionId: string): string {
  return `${debitTransactionId}:${creditTransactionId}`;
}

export function suggestLinks(
  transactions: readonly LinkableTransaction[],
  dismissed: readonly DismissedLinkPair[],
): TransactionLink[] {
  const dismissedKeys = new Set(
    dismissed.map((pair) => dismissedKey(pair.debitTransactionId, pair.creditTransactionId)),
  );
  const debits = transactions.filter((transaction) => transaction.type === "debit");
  const credits = transactions.filter((transaction) => transaction.type === "credit");
  const creditBuckets = creditsByBucket(credits);

  const edges: CandidateEdge[] = [];
  for (const debit of debits) {
    const candidates = creditBuckets.get(bucketKey(debit)) ?? [];
    for (const credit of candidates) {
      if (dismissedKeys.has(dismissedKey(debit.id, credit.id))) continue;
      const edge = candidateEdge(debit, credit);
      if (edge !== null) edges.push(edge);
    }
  }
  edges.sort(compareEdges);

  const takenDebits = new Set<string>();
  const takenCredits = new Set<string>();
  const links: TransactionLink[] = [];
  for (const edge of edges) {
    if (takenDebits.has(edge.debit.id) || takenCredits.has(edge.credit.id)) continue;
    takenDebits.add(edge.debit.id);
    takenCredits.add(edge.credit.id);
    links.push({
      debitTransactionId: edge.debit.id,
      creditTransactionId: edge.credit.id,
      kind: edge.kind,
    });
  }

  return links.sort((a, b) =>
    a.debitTransactionId < b.debitTransactionId
      ? -1
      : a.debitTransactionId > b.debitTransactionId
        ? 1
        : 0,
  );
}
