import { businessDaysBetween } from "./business-days";
import { calendarDaysBetween, padDayRange, type IsoDateRange } from "../year-month";
import type { TransactionDirection } from "../categories/taxonomy";

export const MAX_TRANSFER_BUSINESS_DAYS = 2;

const BUSINESS_DAYS_PER_WEEK = 5;
const WEEKEND_DAYS = 2;

// businessDaysBetween counts weekdays only (design contract decision 2: no
// holiday calendar), so the worst calendar span for MAX_TRANSFER_BUSINESS_DAYS
// business days is whatever count starts right before a weekend: each full
// week of business days still spans 7 calendar days, and a partial week adds
// its own weekend on top. The read window a caller pads by must cover exactly
// that worst case on each side, derived from the same constant, so the pad
// and the pair rule's own span can never drift apart.
function worstCaseCalendarSpan(businessDays: number): number {
  const fullWeeks = Math.floor(businessDays / BUSINESS_DAYS_PER_WEEK);
  const remainder = businessDays % BUSINESS_DAYS_PER_WEEK;
  return (
    fullWeeks * (BUSINESS_DAYS_PER_WEEK + WEEKEND_DAYS) +
    (remainder === 0 ? 0 : remainder + WEEKEND_DAYS)
  );
}

export const PAIRING_READ_PAD_DAYS = worstCaseCalendarSpan(MAX_TRANSFER_BUSINESS_DAYS);

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

// One leg's answer to "does this transaction's counterpart document point at
// the other leg's account?" (design contract's #16 review, item 2, refined by
// round 2 item 3). h is this leg's counterpart hash, t its type, H the other
// leg's own account holder hash: a bank that omits taxNumber leaves H null
// for a real household partner, and a card bill's counterpart is the
// issuer's CNPJ, so neither can reject on its own. Nor can a CPF that is
// itself a household holder: a joint account is often reported with only one
// of its two owners as the account's own holder, so the other owner's CPF
// turning up as h (h !== H) still isn't evidence of a stranger — only a CPF
// that belongs to no household holder at all (h present, H known, h !== H,
// t === "cpf", h not in holderDocumentHashes) does.
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
