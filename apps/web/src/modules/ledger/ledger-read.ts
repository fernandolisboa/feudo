import {
  pairingReadRange,
  type CategorizationRule,
  type IsoDateRange,
  type KindContext,
} from "@feudo/core";

import type { HouseholdScope } from "@/modules/households";
import type { Database } from "@/platform/db/client";

import { createCategorizationRepository } from "./categorization-repository";
import { createHouseholdLedgerRepository } from "./repository";
import { resolveLedgerRows, type ResolvedLedgerRow } from "./resolve-ledger-rows";

export type LedgerReadResult = {
  kinds: KindContext;
  rules: readonly CategorizationRule[];
  rows: ResolvedLedgerRow[];
  padded: ResolvedLedgerRow[];
};

// The one read path behind both /transacoes and /categorias (design
// contract's #16 review, item 3): loads the household's rules, kind
// overrides, subcategories and holder hashes; reads the whole household over
// a range padded by pairingReadRange, because a pair's other leg can land
// just outside the range a caller asked for (a bill paid on the 1st for a
// purchase window closing on the last day of the previous month); resolves
// once; then narrows back to the requested range and, optionally, one
// account. `padded` stays around for a caller that needs to describe a pair
// whose counterpart falls outside that narrowed range (the transactions
// page's tooltip).
export async function readHouseholdLedger(
  db: Database,
  scope: HouseholdScope,
  range: IsoDateRange,
  accountId: string | null,
): Promise<LedgerReadResult> {
  const categorization = createCategorizationRepository(scope);
  const ledger = createHouseholdLedgerRepository(scope);

  const [householdSubcategories, overrides, rules, holderDocumentHashes] = await Promise.all([
    categorization.listHouseholdSubcategories(db),
    categorization.listKindOverrides(db),
    categorization.listRules(db),
    ledger.listHolderDocumentHashes(db),
  ]);
  const kinds: KindContext = {
    overrides,
    householdSubcategories: new Map(
      householdSubcategories.map((subcategory) => [subcategory.id, subcategory]),
    ),
  };

  const paddedTransactions = await ledger.listTransactionsInRange(db, {
    days: pairingReadRange(range),
    accountId: null,
  });
  const padded = resolveLedgerRows(paddedTransactions, { rules, kinds, holderDocumentHashes });
  const rows = padded.filter(
    (row) =>
      row.date >= range.from &&
      row.date <= range.to &&
      (accountId === null || row.accountId === accountId),
  );

  return { kinds, rules, rows, padded };
}
