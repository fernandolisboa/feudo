import {
  localDateOf,
  pairingReadRange,
  type CategorizationRule,
  type IsoDateRange,
  type KindContext,
} from "@feudo/core";

import type { HouseholdScope } from "@/modules/households";
import type { Database } from "@/platform/db/client";

import { createCategorizationRepository } from "./categorization-repository";
import { createHouseholdLedgerRepository, type LedgerTransactionRow } from "./repository";
import { resolveLedgerRows, type ResolvedLedgerRow } from "./resolve-ledger-rows";

export type LedgerReadResult = {
  kinds: KindContext;
  rules: readonly CategorizationRule[];
  rows: ResolvedLedgerRow[];
  padded: ResolvedLedgerRow[];
};

// A row's stored `date` is the UTC prefix of whatever instant the provider
// sent, which lands on the wrong calendar day for a transaction that
// happened late at night in a time zone behind UTC; `occurredAt`, when the
// provider gave a real instant, is resolved into the household's own local
// day instead, since an account's household (and so its time zone) can
// change after sync. Re-sorted on the same keys `listTransactionsInRange`
// orders by, since localizing can move a row past another that shares its
// stored date.
function localizeRowDates(
  rows: readonly LedgerTransactionRow[],
  timeZone: string,
): LedgerTransactionRow[] {
  return rows
    .map((row) =>
      row.occurredAt === null ? row : { ...row, date: localDateOf(row.occurredAt, timeZone) },
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        a.amountCentavos - b.amountCentavos ||
        a.id.localeCompare(b.id),
    );
}

// The one read path behind both /transacoes and /categorias (design
// contract's #16 review, item 3): loads the household's rules, kind
// overrides, subcategories and holder hashes; reads the whole household over
// a range padded by pairingReadRange, because a pair's other leg can land
// just outside the range a caller asked for (a bill paid on the 1st for a
// purchase window closing on the last day of the previous month); localizes
// each row's date to the household's own time zone; resolves once; then
// narrows back to the requested range and, optionally, one account. `padded`
// stays around for a caller that needs to describe a pair whose counterpart
// falls outside that narrowed range (the transactions page's tooltip).
export async function readHouseholdLedger(
  db: Database,
  scope: HouseholdScope,
  range: IsoDateRange,
  accountId: string | null,
  timeZone: string,
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
  const localizedTransactions = localizeRowDates(paddedTransactions, timeZone);
  const padded = resolveLedgerRows(localizedTransactions, { rules, kinds, holderDocumentHashes });
  const rows = padded.filter(
    (row) =>
      row.date >= range.from &&
      row.date <= range.to &&
      (accountId === null || row.accountId === accountId),
  );

  return { kinds, rules, rows, padded };
}
