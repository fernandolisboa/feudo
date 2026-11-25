import { suggestionFingerprint } from "./fingerprint";
import type { TransactionDirection } from "./taxonomy";

export type AiBatchRow = {
  id: string;
  description: string;
  type: TransactionDirection;
  amountCentavos: number;
  currency: string;
  eligible: boolean;
};

export type AiSuggestionGroup = {
  transactionIds: string[];
  description: string;
  type: TransactionDirection;
  absoluteAmountCentavos: number;
  currency: string;
};

// What one press of "Sugerir categorias com IA" sends: `rows` in queue order
// (largest amount first), grouped by fingerprint so a repeated description,
// amount and direction is asked only once. A row already asked under the
// current prompt version (its id is in `askedIds`) is left out, and so is
// every other row that shares its fingerprint — the read side
// (packages/core's suggest.ts) already has an answer for that question and
// would otherwise overwrite it with a second, possibly different one.
export function batchForAiSuggestion(
  rows: readonly AiBatchRow[],
  askedIds: ReadonlySet<string>,
  limit: number,
): AiSuggestionGroup[] {
  const askedFingerprints = new Set(
    rows.filter((row) => askedIds.has(row.id)).map((row) => suggestionFingerprint(row)),
  );

  const groups = new Map<string, AiSuggestionGroup>();
  const order: string[] = [];
  for (const row of rows) {
    if (!row.eligible || askedIds.has(row.id)) {
      continue;
    }
    const fingerprint = suggestionFingerprint(row);
    if (askedFingerprints.has(fingerprint)) {
      continue;
    }
    const existing = groups.get(fingerprint);
    if (existing) {
      existing.transactionIds.push(row.id);
      continue;
    }
    groups.set(fingerprint, {
      transactionIds: [row.id],
      description: row.description,
      type: row.type,
      absoluteAmountCentavos: Math.abs(row.amountCentavos),
      currency: row.currency,
    });
    order.push(fingerprint);
  }

  return order.slice(0, limit).map((fingerprint) => {
    const group = groups.get(fingerprint);
    if (!group) {
      throw new Error(`batchForAiSuggestion lost group ${fingerprint}`);
    }
    return group;
  });
}
