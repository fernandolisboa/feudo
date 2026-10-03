import { eq } from "drizzle-orm";

import type { CurrentSession } from "@/modules/auth";

import { getDb } from "@/platform/db/client";
import {
  bankAccount,
  bankConnection,
  bankConnectionConsent,
  bankTransaction,
  providerCredential,
} from "./schema";
import { userScope } from "./scope";

// The LGPD export's own reader (#25): everything this slice owns about the
// session's user, never a loose id. Ciphertext never leaves provider_credential
// (CLAUDE.md "never the ciphertext"), and holder/counterpart document hashes
// never leave bank_account/bank_transaction — both can be another person's
// CPF hash, so neither belongs in a file one user downloads.
export async function getSyncExportData(session: CurrentSession) {
  const db = getDb();
  const scope = userScope(session);

  const [providerCredentials, bankConnectionConsents, bankConnections, accounts, transactions] =
    await Promise.all([
      db
        .select({
          provider: providerCredential.provider,
          createdAt: providerCredential.createdAt,
          lastValidatedAt: providerCredential.lastValidatedAt,
        })
        .from(providerCredential)
        .where(eq(providerCredential.userId, scope.userId)),

      db
        .select({
          id: bankConnectionConsent.id,
          scopeVersion: bankConnectionConsent.scopeVersion,
          scopeText: bankConnectionConsent.scopeText,
          acceptedAt: bankConnectionConsent.acceptedAt,
        })
        .from(bankConnectionConsent)
        .where(eq(bankConnectionConsent.userId, scope.userId)),

      db
        .select({
          id: bankConnection.id,
          provider: bankConnection.provider,
          providerItemId: bankConnection.providerItemId,
          institutionName: bankConnection.institutionName,
          createdAt: bankConnection.createdAt,
          lastSyncedAt: bankConnection.lastSyncedAt,
          lastSyncAttemptedAt: bankConnection.lastSyncAttemptedAt,
          lastSyncError: bankConnection.lastSyncError,
          consentId: bankConnection.consentId,
        })
        .from(bankConnection)
        .where(eq(bankConnection.userId, scope.userId)),

      db
        .select({
          id: bankAccount.id,
          connectionId: bankAccount.connectionId,
          householdId: bankAccount.householdId,
          type: bankAccount.type,
          productType: bankAccount.productType,
          name: bankAccount.name,
          balanceCentavos: bankAccount.balanceCentavos,
          currency: bankAccount.currency,
          label: bankAccount.label,
          ratePpm: bankAccount.ratePpm,
          rateType: bankAccount.rateType,
          dueDate: bankAccount.dueDate,
          acquisitionDate: bankAccount.acquisitionDate,
          syncedAt: bankAccount.syncedAt,
          createdAt: bankAccount.createdAt,
        })
        .from(bankAccount)
        .innerJoin(bankConnection, eq(bankConnection.id, bankAccount.connectionId))
        .where(eq(bankConnection.userId, scope.userId)),

      db
        .select({
          id: bankTransaction.id,
          accountId: bankTransaction.accountId,
          date: bankTransaction.date,
          occurredAt: bankTransaction.occurredAt,
          amountCentavos: bankTransaction.amountCentavos,
          currency: bankTransaction.currency,
          description: bankTransaction.description,
          providerCategory: bankTransaction.providerCategory,
          type: bankTransaction.type,
          counterpartType: bankTransaction.counterpartType,
          syncedAt: bankTransaction.syncedAt,
        })
        .from(bankTransaction)
        .innerJoin(bankAccount, eq(bankAccount.id, bankTransaction.accountId))
        .innerJoin(bankConnection, eq(bankConnection.id, bankAccount.connectionId))
        .where(eq(bankConnection.userId, scope.userId)),
    ]);

  return { providerCredentials, bankConnectionConsents, bankConnections, accounts, transactions };
}

export type SyncExportData = Awaited<ReturnType<typeof getSyncExportData>>;
