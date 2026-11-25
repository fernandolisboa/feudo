import { normalizeDescription } from "./description";
import type { TransactionDirection } from "./taxonomy";

export type FingerprintedTransaction = {
  description: string;
  amountCentavos: number;
  currency: string;
  type: TransactionDirection;
};

// normalizeDescription only ever emits uppercase letters, digits and single
// spaces between them, so "|" can never appear in its output and is safe as
// a field separator here.
const SEPARATOR = "|";

// What makes two pending transactions "the same question" for an AI category
// suggestion: same wording once normalized, same absolute amount (sign only
// ever encodes direction, which is carried separately), same currency, same
// direction. Used both to group a press's candidates and, at read time, to
// let a transaction with no suggestion of its own inherit one from another
// that asked the same question.
export function suggestionFingerprint(transaction: FingerprintedTransaction): string {
  return [
    normalizeDescription(transaction.description),
    String(Math.abs(transaction.amountCentavos)),
    transaction.currency,
    transaction.type,
  ].join(SEPARATOR);
}
