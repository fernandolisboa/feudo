import type { HouseholdSession } from "@/modules/households";
import { listFinancialDataAccessForExport } from "@/modules/audit";
import { getHouseholdMembershipsForExport } from "@/modules/households";
import { getLedgerExportAnnotations } from "@/modules/ledger";
import { getReserveMarksForExport } from "@/modules/reserve";
import { getSyncExportData } from "@/modules/sync";

import { getDb } from "@/platform/db/client";
import { getExportUser } from "./repository";

function isoOrNull(date: Date | null): string | null {
  return date === null ? null : date.toISOString();
}

export type ExportDocument = {
  formatVersion: 1;
  exportedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    createdAt: string;
    termsVersion: string;
    termsAcceptedAt: string;
    theme: string;
  };
  households: Array<{
    householdId: string;
    name: string;
    role: string;
    joinedAt: string;
    deletionPending: boolean;
  }>;
  providerCredentials: Array<{ provider: string; createdAt: string; lastValidatedAt: string }>;
  bankConnectionConsents: Array<{
    id: string;
    scopeVersion: string;
    scopeText: string;
    acceptedAt: string;
  }>;
  bankConnections: Array<{
    id: string;
    provider: string;
    providerItemId: string;
    institutionName: string;
    createdAt: string;
    lastSyncedAt: string | null;
    lastSyncAttemptedAt: string | null;
    lastSyncError: string | null;
    consentId: string;
  }>;
  accounts: Array<{
    id: string;
    connectionId: string;
    householdId: string | null;
    type: string;
    productType: string | null;
    name: string;
    balanceCentavos: number;
    currency: string;
    label: string;
    ratePpm: number | null;
    rateType: string | null;
    dueDate: string | null;
    acquisitionDate: string | null;
    syncedAt: string;
    createdAt: string;
  }>;
  transactions: Array<{
    id: string;
    accountId: string;
    date: string;
    occurredAt: string | null;
    amountCentavos: number;
    currency: string;
    description: string;
    providerCategory: string | null;
    type: string;
    counterpartType: string | null;
    syncedAt: string;
  }>;
  annotations: {
    categorizations: Array<{
      transactionId: string;
      productSubcategoryId: string | null;
      householdSubcategoryId: string | null;
      householdSubcategoryName: string | null;
      categorizedAt: string;
    }>;
    internalTransferMarks: Array<{
      transactionId: string;
      isInternalTransfer: boolean;
      markedAt: string;
    }>;
    categorizationRules: Array<{
      id: string;
      householdId: string;
      pattern: string;
      direction: string | null;
      productSubcategoryId: string | null;
      householdSubcategoryId: string | null;
      createdAt: string;
    }>;
    reserveMarks: Array<{
      householdId: string;
      accountId: string;
      isReserve: boolean;
      liquidity: string | null;
      institutionId: string | null;
      updatedAt: string;
    }>;
  };
  financialDataAccess: Array<{ householdId: string; kind: string; accessedAt: string }>;
};

export class ExportUserMissingError extends Error {
  constructor(userId: string) {
    super(`No user row for session user ${userId}; the export cannot proceed.`);
    this.name = "ExportUserMissingError";
  }
}

// Composes every slice's single export reader (ADR-0011, 2026-10-03
// amendment): one DB read path per slice, all run in parallel, since none
// of them write and none depends on another's result. Every reader takes
// the full session, so nothing here can be tricked into reading another
// user's rows with a loose id.
export async function buildExportDocument(
  session: HouseholdSession,
  exportedAt: Date,
): Promise<ExportDocument> {
  const [userRow, households, sync, ledger, reserveMarks, financialDataAccess] = await Promise.all([
    getExportUser(getDb(), session.userId),
    getHouseholdMembershipsForExport(session),
    getSyncExportData(session),
    getLedgerExportAnnotations(session),
    getReserveMarksForExport(session),
    listFinancialDataAccessForExport(session),
  ]);

  if (!userRow) {
    throw new ExportUserMissingError(session.userId);
  }

  return {
    formatVersion: 1,
    exportedAt: exportedAt.toISOString(),
    user: {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      emailVerified: userRow.emailVerified,
      createdAt: userRow.createdAt.toISOString(),
      termsVersion: userRow.termsVersion,
      termsAcceptedAt: userRow.termsAcceptedAt.toISOString(),
      theme: userRow.theme,
    },
    households: households.map((household) => ({
      householdId: household.householdId,
      name: household.name,
      role: household.role,
      joinedAt: household.joinedAt.toISOString(),
      deletionPending: household.deletionPending,
    })),
    providerCredentials: sync.providerCredentials.map((credential) => ({
      provider: credential.provider,
      createdAt: credential.createdAt.toISOString(),
      lastValidatedAt: credential.lastValidatedAt.toISOString(),
    })),
    bankConnectionConsents: sync.bankConnectionConsents.map((consent) => ({
      id: consent.id,
      scopeVersion: consent.scopeVersion,
      scopeText: consent.scopeText,
      acceptedAt: consent.acceptedAt.toISOString(),
    })),
    bankConnections: sync.bankConnections.map((connection) => ({
      id: connection.id,
      provider: connection.provider,
      providerItemId: connection.providerItemId,
      institutionName: connection.institutionName,
      createdAt: connection.createdAt.toISOString(),
      lastSyncedAt: isoOrNull(connection.lastSyncedAt),
      lastSyncAttemptedAt: isoOrNull(connection.lastSyncAttemptedAt),
      lastSyncError: connection.lastSyncError,
      consentId: connection.consentId,
    })),
    accounts: sync.accounts.map((account) => ({
      id: account.id,
      connectionId: account.connectionId,
      householdId: account.householdId,
      type: account.type,
      productType: account.productType,
      name: account.name,
      balanceCentavos: account.balanceCentavos,
      currency: account.currency,
      label: account.label,
      ratePpm: account.ratePpm,
      rateType: account.rateType,
      dueDate: account.dueDate,
      acquisitionDate: account.acquisitionDate,
      syncedAt: account.syncedAt.toISOString(),
      createdAt: account.createdAt.toISOString(),
    })),
    transactions: sync.transactions.map((transaction) => ({
      id: transaction.id,
      accountId: transaction.accountId,
      date: transaction.date,
      occurredAt: isoOrNull(transaction.occurredAt),
      amountCentavos: transaction.amountCentavos,
      currency: transaction.currency,
      description: transaction.description,
      providerCategory: transaction.providerCategory,
      type: transaction.type,
      counterpartType: transaction.counterpartType,
      syncedAt: transaction.syncedAt.toISOString(),
    })),
    annotations: {
      categorizations: ledger.categorizations.map((categorization) => ({
        transactionId: categorization.transactionId,
        productSubcategoryId: categorization.productSubcategoryId,
        householdSubcategoryId: categorization.householdSubcategoryId,
        householdSubcategoryName: categorization.householdSubcategoryName,
        categorizedAt: categorization.categorizedAt.toISOString(),
      })),
      internalTransferMarks: ledger.internalTransferMarks.map((mark) => ({
        transactionId: mark.transactionId,
        isInternalTransfer: mark.isInternalTransfer,
        markedAt: mark.markedAt.toISOString(),
      })),
      categorizationRules: ledger.categorizationRules.map((rule) => ({
        id: rule.id,
        householdId: rule.householdId,
        pattern: rule.pattern,
        direction: rule.direction,
        productSubcategoryId: rule.productSubcategoryId,
        householdSubcategoryId: rule.householdSubcategoryId,
        createdAt: rule.createdAt.toISOString(),
      })),
      reserveMarks: reserveMarks.map((mark) => ({
        householdId: mark.householdId,
        accountId: mark.accountId,
        isReserve: mark.isReserve,
        liquidity: mark.liquidity,
        institutionId: mark.institutionId,
        updatedAt: mark.updatedAt.toISOString(),
      })),
    },
    financialDataAccess: financialDataAccess.map((access) => ({
      householdId: access.householdId,
      kind: access.kind,
      accessedAt: access.accessedAt.toISOString(),
    })),
  };
}
