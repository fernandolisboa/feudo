import { businessDaysBetween } from "./business-days";
import type { TransactionDirection } from "../categories/taxonomy";

export const MAX_TRANSFER_BUSINESS_DAYS = 2;

export type PairableTransaction = {
  id: string;
  accountId: string;
  date: string;
  amountCentavos: number;
  currency: string;
  type: TransactionDirection;
  counterpartDocumentHash: string | null;
};

export type TransferPair = {
  debitId: string;
  creditId: string;
  confirmed: boolean;
};

type CandidateEdge = {
  debit: PairableTransaction;
  credit: PairableTransaction;
  confirmed: boolean;
  businessDays: number;
  calendarDays: number;
};

function calendarDaysBetween(a: string, b: string): number {
  const dayMs = 24 * 60 * 60 * 1000;
  const aTime = Date.parse(`${a}T00:00:00Z`);
  const bTime = Date.parse(`${b}T00:00:00Z`);
  return Math.abs(aTime - bTime) / dayMs;
}

function hashesAreHouseholdHolders(
  debit: PairableTransaction,
  credit: PairableTransaction,
  holderDocumentHashes: ReadonlySet<string>,
): boolean {
  const presentHashes = [debit.counterpartDocumentHash, credit.counterpartDocumentHash].filter(
    (hash): hash is string => hash !== null,
  );
  return presentHashes.every((hash) => holderDocumentHashes.has(hash));
}

function candidateEdge(
  debit: PairableTransaction,
  credit: PairableTransaction,
  holderDocumentHashes: ReadonlySet<string>,
): CandidateEdge | null {
  if (debit.accountId === credit.accountId) return null;
  if (debit.currency !== credit.currency) return null;

  const debitMagnitude = Math.abs(debit.amountCentavos);
  const creditMagnitude = Math.abs(credit.amountCentavos);
  if (debitMagnitude === 0 || debitMagnitude !== creditMagnitude) return null;

  const businessDays = businessDaysBetween(debit.date, credit.date);
  if (businessDays > MAX_TRANSFER_BUSINESS_DAYS) return null;

  if (!hashesAreHouseholdHolders(debit, credit, holderDocumentHashes)) return null;

  const confirmed =
    debit.counterpartDocumentHash !== null || credit.counterpartDocumentHash !== null;
  return {
    debit,
    credit,
    confirmed,
    businessDays,
    calendarDays: calendarDaysBetween(debit.date, credit.date),
  };
}

function compareEdges(a: CandidateEdge, b: CandidateEdge): number {
  if (a.confirmed !== b.confirmed) return a.confirmed ? -1 : 1;
  if (a.businessDays !== b.businessDays) return a.businessDays - b.businessDays;
  if (a.calendarDays !== b.calendarDays) return a.calendarDays - b.calendarDays;
  if (a.debit.id !== b.debit.id) return a.debit.id < b.debit.id ? -1 : 1;
  if (a.credit.id !== b.credit.id) return a.credit.id < b.credit.id ? -1 : 1;
  return 0;
}

export function pairInternalTransfers(
  transactions: readonly PairableTransaction[],
  holderDocumentHashes: ReadonlySet<string>,
): TransferPair[] {
  const debits = transactions.filter((transaction) => transaction.type === "debit");
  const credits = transactions.filter((transaction) => transaction.type === "credit");

  const edges: CandidateEdge[] = [];
  for (const debit of debits) {
    for (const credit of credits) {
      const edge = candidateEdge(debit, credit, holderDocumentHashes);
      if (edge !== null) edges.push(edge);
    }
  }
  edges.sort(compareEdges);

  const takenDebits = new Set<string>();
  const takenCredits = new Set<string>();
  const pairs: TransferPair[] = [];
  for (const edge of edges) {
    if (takenDebits.has(edge.debit.id) || takenCredits.has(edge.credit.id)) continue;
    takenDebits.add(edge.debit.id);
    takenCredits.add(edge.credit.id);
    pairs.push({ debitId: edge.debit.id, creditId: edge.credit.id, confirmed: edge.confirmed });
  }

  return pairs.sort((a, b) => (a.debitId < b.debitId ? -1 : a.debitId > b.debitId ? 1 : 0));
}
