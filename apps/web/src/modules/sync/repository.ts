import { and, count, eq, exists, gte, inArray, lt, notExists, sql } from "drizzle-orm";

import { user } from "@/modules/auth/schema";

import {
  bankAccount,
  bankConnection,
  bankConnectionConsent,
  providerAuthAttempt,
  providerCredential,
} from "./schema";

import type { Database as Connection } from "@/platform/db/client";
import type { HouseholdScope } from "@/modules/households";
import type { AccountType, NormalizedAccount, RateType } from "./provider/provider";
import type { UserScope } from "./scope";

// Every method runs equally on the pooled connection or inside a transaction
// it opened, so a service can group several writes into one commit.
export type Database = Connection | Parameters<Parameters<Connection["transaction"]>[0]>[0];

export type DataProviderKind = "pluggy";

export type StoredCredential = {
  id: string;
  provider: DataProviderKind;
  ciphertext: string;
  lastValidatedAt: Date;
};

export type ConsentRecord = {
  id: string;
  scopeVersion: string;
  acceptedAt: Date;
  used: boolean;
};

export type ConnectionSummary = {
  id: string;
  provider: DataProviderKind;
  providerItemId: string;
  institutionName: string;
  lastSyncedAt: Date | null;
  lastSyncError: string | null;
  accountsCount: number;
  createdAt: Date;
};

export type OwnedConnection = {
  id: string;
  provider: DataProviderKind;
  providerItemId: string;
  institutionName: string;
  consentId: string;
};

export type NewConnection = {
  provider: DataProviderKind;
  providerItemId: string;
  institutionName: string;
  institutionProviderId: string;
  consentId: string;
};

// A write that Postgres accepted but returned nothing for, or a consent
// handed in that the scope cannot see: both mean a caller broke an
// invariant, so they surface as a named error rather than a bare one.
export class SyncRepositoryInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyncRepositoryInvariantError";
  }
}

export class ConnectionNotOwnedError extends Error {
  constructor(connectionId: string) {
    super(`Connection ${connectionId} does not belong to the scoped user.`);
    this.name = "ConnectionNotOwnedError";
  }
}

// Every method is scoped by the user closed over at construction (ADR-0001):
// none takes a user id, and a connection id is only ever honoured after the
// row is re-read under that same scope.
export function createSyncUserRepository(scope: UserScope) {
  async function requireOwnedConnection(
    db: Database,
    connectionId: string,
  ): Promise<OwnedConnection> {
    const connection = await findConnection(db, connectionId);
    if (!connection) {
      throw new ConnectionNotOwnedError(connectionId);
    }
    return connection;
  }

  async function findConnection(
    db: Database,
    connectionId: string,
  ): Promise<OwnedConnection | undefined> {
    const rows = await db
      .select({
        id: bankConnection.id,
        provider: bankConnection.provider,
        providerItemId: bankConnection.providerItemId,
        institutionName: bankConnection.institutionName,
        consentId: bankConnection.consentId,
      })
      .from(bankConnection)
      .where(and(eq(bankConnection.id, connectionId), eq(bankConnection.userId, scope.userId)))
      .limit(1);
    return rows[0];
  }

  return {
    async countAuthAttemptsSince(db: Database, since: Date): Promise<number> {
      const [row] = await db
        .select({ total: count() })
        .from(providerAuthAttempt)
        .where(
          and(
            eq(providerAuthAttempt.userId, scope.userId),
            gte(providerAuthAttempt.attemptedAt, since),
          ),
        );
      return row?.total ?? 0;
    },

    async recordAuthAttempt(db: Database): Promise<void> {
      await db.insert(providerAuthAttempt).values({ userId: scope.userId });
    },

    async getCredential(db: Database): Promise<StoredCredential | undefined> {
      const rows = await db
        .select({
          id: providerCredential.id,
          provider: providerCredential.provider,
          ciphertext: providerCredential.ciphertext,
          lastValidatedAt: providerCredential.lastValidatedAt,
        })
        .from(providerCredential)
        .where(eq(providerCredential.userId, scope.userId))
        .limit(1);
      return rows[0];
    },

    async saveCredential(
      db: Database,
      input: { provider: DataProviderKind; ciphertext: string; validatedAt: Date },
    ): Promise<void> {
      await db
        .insert(providerCredential)
        .values({
          userId: scope.userId,
          provider: input.provider,
          ciphertext: input.ciphertext,
          lastValidatedAt: input.validatedAt,
        })
        .onConflictDoUpdate({
          target: [providerCredential.userId, providerCredential.provider],
          set: { ciphertext: input.ciphertext, lastValidatedAt: input.validatedAt },
        });
    },

    async deleteCredential(db: Database): Promise<boolean> {
      const deleted = await db
        .delete(providerCredential)
        .where(eq(providerCredential.userId, scope.userId))
        .returning({ id: providerCredential.id });
      return deleted.length > 0;
    },

    async createConsent(
      db: Database,
      input: { scopeVersion: string; scopeText: string },
    ): Promise<string> {
      const [row] = await db
        .insert(bankConnectionConsent)
        .values({ userId: scope.userId, ...input })
        .returning({ id: bankConnectionConsent.id });
      if (!row) {
        throw new SyncRepositoryInvariantError("consent insert returned no row");
      }
      return row.id;
    },

    async findConsent(db: Database, consentId: string): Promise<ConsentRecord | undefined> {
      const rows = await db
        .select({
          id: bankConnectionConsent.id,
          scopeVersion: bankConnectionConsent.scopeVersion,
          acceptedAt: bankConnectionConsent.acceptedAt,
          used: exists(
            db
              .select({ id: bankConnection.id })
              .from(bankConnection)
              .where(eq(bankConnection.consentId, bankConnectionConsent.id)),
          ).mapWith(Boolean),
        })
        .from(bankConnectionConsent)
        .where(
          and(
            eq(bankConnectionConsent.id, consentId),
            eq(bankConnectionConsent.userId, scope.userId),
          ),
        )
        .limit(1);
      return rows[0];
    },

    async listConnections(db: Database): Promise<ConnectionSummary[]> {
      const rows = await db
        .select({
          id: bankConnection.id,
          provider: bankConnection.provider,
          providerItemId: bankConnection.providerItemId,
          institutionName: bankConnection.institutionName,
          lastSyncedAt: bankConnection.lastSyncedAt,
          lastSyncError: bankConnection.lastSyncError,
          accountsCount: count(bankAccount.id),
          createdAt: bankConnection.createdAt,
        })
        .from(bankConnection)
        .leftJoin(bankAccount, eq(bankAccount.connectionId, bankConnection.id))
        .where(eq(bankConnection.userId, scope.userId))
        .groupBy(bankConnection.id)
        .orderBy(bankConnection.createdAt);
      return rows;
    },

    findConnection,

    async findConnectionByItem(
      db: Database,
      provider: DataProviderKind,
      providerItemId: string,
    ): Promise<OwnedConnection | undefined> {
      const rows = await db
        .select({
          id: bankConnection.id,
          provider: bankConnection.provider,
          providerItemId: bankConnection.providerItemId,
          institutionName: bankConnection.institutionName,
          consentId: bankConnection.consentId,
        })
        .from(bankConnection)
        .where(
          and(
            eq(bankConnection.userId, scope.userId),
            eq(bankConnection.provider, provider),
            eq(bankConnection.providerItemId, providerItemId),
          ),
        )
        .limit(1);
      return rows[0];
    },

    async createConnection(db: Database, input: NewConnection): Promise<string> {
      const consent = await this.findConsent(db, input.consentId);
      if (!consent || consent.used) {
        throw new SyncRepositoryInvariantError("consent is not the scoped user's, or already used");
      }
      const [row] = await db
        .insert(bankConnection)
        .values({ userId: scope.userId, ...input })
        .returning({ id: bankConnection.id });
      if (!row) {
        throw new SyncRepositoryInvariantError("connection insert returned no row");
      }
      return row.id;
    },

    // Deletes the connection (its accounts cascade) and, in the same
    // transaction, the consent row once nothing references it any more:
    // consent lives exactly as long as the connections it backed (ADR-0008).
    async deleteConnection(db: Database, connectionId: string): Promise<boolean> {
      const connection = await findConnection(db, connectionId);
      if (!connection) {
        return false;
      }
      await db.transaction(async (tx) => {
        await tx.delete(bankConnection).where(eq(bankConnection.id, connection.id));
        await tx
          .delete(bankConnectionConsent)
          .where(
            and(
              eq(bankConnectionConsent.id, connection.consentId),
              notExists(
                tx
                  .select({ id: bankConnection.id })
                  .from(bankConnection)
                  .where(eq(bankConnection.consentId, connection.consentId)),
              ),
            ),
          );
      });
      return true;
    },

    async markSynced(
      db: Database,
      connectionId: string,
      result: { syncedAt: Date; error: string | null },
    ): Promise<void> {
      await requireOwnedConnection(db, connectionId);
      await db
        .update(bankConnection)
        .set({ lastSyncedAt: result.syncedAt, lastSyncError: result.error })
        .where(eq(bankConnection.id, connectionId));
    },

    // New accounts land in the assigned household with the default label; an
    // account seen before keeps its household and label and only refreshes
    // what the provider publishes. The household arrives as a scope, never a
    // loose id (ADR-0001): only households.householdScope(session) builds one.
    async upsertAccounts(
      db: Database,
      connectionId: string,
      accounts: NormalizedAccount[],
      options: { assignTo: HouseholdScope | null; syncedAt: Date },
    ): Promise<number> {
      await requireOwnedConnection(db, connectionId);
      // One statement cannot touch the same conflict target twice, and a
      // provider may list the same account under two listings.
      const unique = [
        ...new Map(accounts.map((account) => [account.providerAccountId, account])).values(),
      ];
      if (unique.length === 0) {
        return 0;
      }
      await db
        .insert(bankAccount)
        .values(
          unique.map((account) => ({
            connectionId,
            householdId: options.assignTo?.householdId ?? null,
            providerAccountId: account.providerAccountId,
            type: account.type,
            productType: account.productType,
            name: account.name,
            balanceCentavos: account.balanceCentavos,
            currency: account.currency,
            holderDocumentHash: account.holderDocumentHash,
            ratePpm: account.ratePpm,
            rateType: account.rateType,
            dueDate: account.dueDate,
            acquisitionDate: account.acquisitionDate,
            syncedAt: options.syncedAt,
          })),
        )
        .onConflictDoUpdate({
          target: [bankAccount.connectionId, bankAccount.providerAccountId],
          set: {
            type: sql`excluded.type`,
            productType: sql`excluded.product_type`,
            name: sql`excluded.name`,
            balanceCentavos: sql`excluded.balance_centavos`,
            currency: sql`excluded.currency`,
            holderDocumentHash: sql`excluded.holder_document_hash`,
            ratePpm: sql`excluded.rate_ppm`,
            rateType: sql`excluded.rate_type`,
            dueDate: sql`excluded.due_date`,
            acquisitionDate: sql`excluded.acquisition_date`,
            syncedAt: sql`excluded.synced_at`,
          },
        });
      return unique.length;
    },
  };
}

export type SyncUserRepository = ReturnType<typeof createSyncUserRepository>;

export type AccountLabel = "individual" | "shared";

export type HouseholdAccount = {
  id: string;
  connectionId: string;
  institutionName: string;
  name: string;
  type: AccountType;
  productType: string | null;
  balanceCentavos: number;
  currency: string;
  label: AccountLabel;
  ratePpm: number | null;
  rateType: RateType | null;
  dueDate: string | null;
  connectedByUserId: string;
  connectedByName: string;
  syncedAt: Date;
  lastSyncError: string | null;
};

// Household-scoped view of the accounts assigned to the session's household
// (ADR-0001). Relabelling additionally requires the caller to own the
// connection: the label is a household fact, but only the person who
// connected the account decides it (#12). Both scopes come from the same
// session at construction; no method takes a tenant id.
export function createHouseholdAccountsRepository(scope: HouseholdScope, owner: UserScope) {
  return {
    async list(db: Database): Promise<HouseholdAccount[]> {
      return db
        .select({
          id: bankAccount.id,
          connectionId: bankAccount.connectionId,
          institutionName: bankConnection.institutionName,
          name: bankAccount.name,
          type: bankAccount.type,
          productType: bankAccount.productType,
          balanceCentavos: bankAccount.balanceCentavos,
          currency: bankAccount.currency,
          label: bankAccount.label,
          ratePpm: bankAccount.ratePpm,
          rateType: bankAccount.rateType,
          dueDate: bankAccount.dueDate,
          connectedByUserId: bankConnection.userId,
          connectedByName: user.name,
          syncedAt: bankAccount.syncedAt,
          lastSyncError: bankConnection.lastSyncError,
        })
        .from(bankAccount)
        .innerJoin(bankConnection, eq(bankConnection.id, bankAccount.connectionId))
        .innerJoin(user, eq(user.id, bankConnection.userId))
        .where(eq(bankAccount.householdId, scope.householdId))
        .orderBy(bankConnection.institutionName, bankAccount.type, bankAccount.name);
    },

    async relabel(
      db: Database,
      input: { accountId: string; label: AccountLabel },
    ): Promise<boolean> {
      const ownedConnections = db
        .select({ id: bankConnection.id })
        .from(bankConnection)
        .where(eq(bankConnection.userId, owner.userId));
      const updated = await db
        .update(bankAccount)
        .set({ label: input.label })
        .where(
          and(
            eq(bankAccount.id, input.accountId),
            eq(bankAccount.householdId, scope.householdId),
            inArray(bankAccount.connectionId, ownedConnections),
          ),
        )
        .returning({ id: bankAccount.id });
      return updated.length > 0;
    },
  };
}

export type HouseholdAccountsRepository = ReturnType<typeof createHouseholdAccountsRepository>;

// Not scoped: housekeeping for the daily cron. Attempts older than the
// rate-limit window count for nothing, so they go; a consent that never
// backed a connection belongs to no connection's lifetime, so it goes once it
// is too old to be used (CONSENT_MAX_AGE_MS).
export async function pruneOldAuthAttempts(db: Database, olderThan: Date): Promise<number> {
  const deleted = await db
    .delete(providerAuthAttempt)
    .where(lt(providerAuthAttempt.attemptedAt, olderThan))
    .returning({ id: providerAuthAttempt.id });
  return deleted.length;
}

export async function pruneOrphanConsents(db: Database, olderThan: Date): Promise<number> {
  const deleted = await db
    .delete(bankConnectionConsent)
    .where(
      and(
        lt(bankConnectionConsent.acceptedAt, olderThan),
        notExists(
          db
            .select({ id: bankConnection.id })
            .from(bankConnection)
            .where(eq(bankConnection.consentId, bankConnectionConsent.id)),
        ),
      ),
    )
    .returning({ id: bankConnectionConsent.id });
  return deleted.length;
}
