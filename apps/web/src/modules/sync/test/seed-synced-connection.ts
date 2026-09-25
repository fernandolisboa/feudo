import { eq } from "drizzle-orm";

import type { HouseholdScope } from "@/modules/households";
import type { Database } from "@/platform/db/client";
import type { NormalizedAccount, NormalizedTransaction } from "../provider/provider";
import { createSyncUserRepository, type MoveAccountResult } from "../repository";
import { bankAccount } from "../schema";
import type { SeededUser } from "./with-two-users";

export const SEED_ITEM_ID = "0f1e2d3c-4b5a-4a6b-8c7d-8e9f0a1b2c3d";

export function seedAccount(overrides: Partial<NormalizedAccount> = {}): NormalizedAccount {
  return {
    providerAccountId: "acc-1",
    providerItemId: SEED_ITEM_ID,
    type: "checking",
    productType: null,
    name: "Conta corrente",
    balanceCentavos: 123456,
    currency: "BRL",
    holderDocumentHash: null,
    ratePpm: null,
    rateType: null,
    dueDate: null,
    acquisitionDate: null,
    ...overrides,
  };
}

export function seedTransaction(
  overrides: Partial<NormalizedTransaction> = {},
): NormalizedTransaction {
  return {
    providerTransactionId: "tx-1",
    providerAccountId: "acc-1",
    date: "2026-09-15",
    amountCentavos: -1000,
    currency: "BRL",
    description: "COMPRA",
    providerCategory: null,
    type: "debit",
    counterpartType: null,
    counterpartDocumentHash: null,
    ...overrides,
  };
}

export type SeededConnection = {
  connectionId: string;
  accountIdsByProvider: Map<string, string>;
};

// Seeds a connection as a finished sync would leave it, so another slice's
// tests can prove what its household scope sees without going through the
// provider. Every write goes through the owner's own scoped repository.
export async function seedSyncedConnection(
  db: Database,
  owner: SeededUser,
  options: {
    household: HouseholdScope;
    itemId?: string;
    accounts?: NormalizedAccount[];
    transactions?: NormalizedTransaction[];
    syncedAt?: Date;
  },
): Promise<SeededConnection> {
  const repository = createSyncUserRepository(owner.scope);
  const syncedAt = options.syncedAt ?? new Date();
  const consentId = await repository.createConsent(db, { scopeVersion: "v", scopeText: "text" });
  const connectionId = await repository.createConnection(db, {
    provider: "pluggy",
    providerItemId: options.itemId ?? SEED_ITEM_ID,
    institutionName: "Banco Fixture",
    institutionProviderId: "601",
    consentId,
    defaultHousehold: options.household,
  });
  await repository.upsertAccounts(db, connectionId, options.accounts ?? [seedAccount()], {
    syncedAt,
  });
  await repository.upsertTransactions(db, connectionId, options.transactions ?? [], { syncedAt });
  await repository.markSynced(db, connectionId, { syncedAt, error: null });

  const accounts = await db
    .select({ id: bankAccount.id, providerAccountId: bankAccount.providerAccountId })
    .from(bankAccount)
    .where(eq(bankAccount.connectionId, connectionId));
  return {
    connectionId,
    accountIdsByProvider: new Map(
      accounts.map((account) => [account.providerAccountId, account.id]),
    ),
  };
}

export async function moveSeededAccount(
  db: Database,
  owner: SeededUser,
  accountId: string,
  householdId: string,
): Promise<MoveAccountResult> {
  return createSyncUserRepository(owner.scope).moveAccount(db, { accountId, householdId });
}
