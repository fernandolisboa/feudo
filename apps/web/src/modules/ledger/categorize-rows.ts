import {
  resolveLedger,
  type Categorization,
  type InternalTransfer,
  type Kind,
  type LedgerContext,
  type LedgerTransaction,
} from "@feudo/core";

import type { LedgerTransactionRow } from "./repository";

export type ResolvedLedgerRow = LedgerTransactionRow & {
  categorization: Categorization | null;
  kind: Kind | null;
  internalTransfer: InternalTransfer | null;
};

function toLedgerTransaction(row: LedgerTransactionRow): LedgerTransaction {
  return {
    id: row.id,
    accountId: row.accountId,
    date: row.date,
    amountCentavos: row.amountCentavos,
    currency: row.currency,
    type: row.type,
    counterpartDocumentHash: row.counterpartDocumentHash,
    accountType: row.accountType,
    description: row.description,
    providerCategory: row.providerCategory,
    manual: row.manual,
    transferMark: row.transferMark,
  };
}

// A thin adapter over packages/core's resolveLedger (design contract's
// read-time model, #16): every caller in this slice needs the row it read
// back alongside what resolveLedger decided for it, keyed by id so this
// stays a plain lookup rather than trusting order across the two arrays.
export function resolveLedgerRows(
  rows: readonly LedgerTransactionRow[],
  context: LedgerContext,
): ResolvedLedgerRow[] {
  const resolvedById = new Map(
    resolveLedger(rows.map(toLedgerTransaction), context).map((resolved) => [
      resolved.id,
      resolved,
    ]),
  );
  return rows.map((row) => {
    const resolved = resolvedById.get(row.id);
    return {
      ...row,
      categorization: resolved?.categorization ?? null,
      kind: resolved?.kind ?? null,
      internalTransfer: resolved?.internalTransfer ?? null,
    };
  });
}
