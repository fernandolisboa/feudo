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
    counterpartType: row.counterpartType,
    accountHolderDocumentHash: row.accountHolderDocumentHash,
    accountType: row.accountType,
    description: row.description,
    providerCategory: row.providerCategory,
    manual: row.manual,
    transferMark: row.transferMark,
  };
}

// A thin adapter over packages/core's resolveLedger (design contract's
// read-time model, #16): resolveLedger returns one entry per input, in the
// same order (property-tested in core), so the two arrays zip by index.
export function resolveLedgerRows(
  rows: readonly LedgerTransactionRow[],
  context: LedgerContext,
): ResolvedLedgerRow[] {
  const resolved = resolveLedger(rows.map(toLedgerTransaction), context);
  return rows.map((row, index) => {
    const item = resolved[index] ?? { categorization: null, kind: null, internalTransfer: null };
    return {
      ...row,
      categorization: item.categorization,
      kind: item.kind,
      internalTransfer: item.internalTransfer,
    };
  });
}
