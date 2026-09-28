import { businessDaysBetween } from "./business-days";
import { calendarDaysBetween, padDayRange, shiftIsoDate, type IsoDateRange } from "../year-month";
import type { TransactionDirection } from "../categories/taxonomy";

export const MAX_TRANSFER_BUSINESS_DAYS = 2;

const DAYS_IN_WEEK = 7;
// Any Monday: shifting from it reaches every start weekday.
const A_MONDAY = "2024-01-01";

// Walks the pair rule's own businessDaysBetween instead of a week formula,
// which undercounts near weekends (5 business days from a Friday span 9
// calendar days, not 7).
function longestCalendarSpan(maxBusinessDays: number): number {
  let longest = 0;
  for (let startOffset = 0; startOffset < DAYS_IN_WEEK; startOffset += 1) {
    const start = shiftIsoDate(A_MONDAY, startOffset);
    let span = 1;
    while (businessDaysBetween(start, shiftIsoDate(start, span)) <= maxBusinessDays) {
      longest = Math.max(longest, span);
      span += 1;
    }
  }
  return longest;
}

// Twice the span: a candidate just past the window's edge can itself have a
// better-ranked candidate one span further, and both months that read the
// boundary transaction must see it to pair it the same way (ADR-0003).
export const PAIRING_READ_PAD_DAYS = 2 * longestCalendarSpan(MAX_TRANSFER_BUSINESS_DAYS);

export function pairingReadRange(range: IsoDateRange): IsoDateRange {
  return padDayRange(range, PAIRING_READ_PAD_DAYS);
}

export type CounterpartType = "cpf" | "cnpj";

export type PairableTransaction = {
  id: string;
  accountId: string;
  date: string;
  amountCentavos: number;
  currency: string;
  type: TransactionDirection;
  counterpartDocumentHash: string | null;
  counterpartType: CounterpartType | null;
  accountHolderDocumentHash: string | null;
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

type LegEvidence = "confirms" | "rejects" | "none";

// A CPF counterpart that differs from the other leg's own holder still
// isn't evidence of a stranger when it belongs to a household holder: a
// joint account is often reported with only one of its two owners as the
// account's own holder.
function legEvidence(
  leg: PairableTransaction,
  otherAccountHolderHash: string | null,
  holderDocumentHashes: ReadonlySet<string>,
): LegEvidence {
  const h = leg.counterpartDocumentHash;
  if (h === null) {
    return "none";
  }
  if (otherAccountHolderHash !== null) {
    if (h === otherAccountHolderHash) {
      return "confirms";
    }
    if (leg.counterpartType === "cpf") {
      return holderDocumentHashes.has(h) ? "none" : "rejects";
    }
    return "none";
  }
  return holderDocumentHashes.has(h) ? "confirms" : "none";
}

function evaluateEvidence(
  debit: PairableTransaction,
  credit: PairableTransaction,
  holderDocumentHashes: ReadonlySet<string>,
): { rejected: boolean; confirmed: boolean } {
  const debitEvidence = legEvidence(debit, credit.accountHolderDocumentHash, holderDocumentHashes);
  const creditEvidence = legEvidence(credit, debit.accountHolderDocumentHash, holderDocumentHashes);
  const rejected = debitEvidence === "rejects" || creditEvidence === "rejects";
  const confirmed = !rejected && (debitEvidence === "confirms" || creditEvidence === "confirms");
  return { rejected, confirmed };
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

  const evidence = evaluateEvidence(debit, credit, holderDocumentHashes);
  if (evidence.rejected) return null;

  return {
    debit,
    credit,
    confirmed: evidence.confirmed,
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
