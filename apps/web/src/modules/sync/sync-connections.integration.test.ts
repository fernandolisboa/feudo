import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { householdScope } from "@/modules/households";

import { encryptSecret } from "./crypto";
import { createDocumentHasher } from "./document-hash";
import { FAKE_INVALID_CLIENT_SECRET, FAKE_ITEM_BANCO_FIXTURE } from "./provider/fake-fixtures";
import { createFakeProvider } from "./provider/fake-provider";
import { ProviderUnavailableError } from "./provider/provider";
import { createHouseholdAccountsRepository, createSyncUserRepository } from "./repository";
import { bankAccount, bankConnection, bankTransaction } from "./schema";
import { syncAllConnections, type SyncDeps } from "./service";
import { seedAccount, seedSyncedConnection } from "./test/seed-synced-connection";
import { withTwoUsers, type TwoUsers } from "./test/with-two-users";

import type { Database } from "@/platform/db/client";
import type { DataProvider } from "./provider/provider";

const ENCRYPTION_KEY = "integration-test-encryption-key-with-32-chars";
const deps: SyncDeps = {
  provider: createFakeProvider(createDocumentHasher("integration-test-document-hash-key-32ch!")),
  encryptionKey: ENCRYPTION_KEY,
};
const NOW = new Date("2026-09-22T06:00:00.000Z");
const FIXTURE_CHECKING = "a1000000-0000-4000-8000-000000000001";

async function saveCredentials(
  db: Database,
  user: TwoUsers["userA"],
  clientSecret = "client-secret",
): Promise<void> {
  await createSyncUserRepository(user.scope).saveCredential(db, {
    provider: "pluggy",
    ciphertext: encryptSecret(JSON.stringify({ clientId: "id", clientSecret }), ENCRYPTION_KEY),
    validatedAt: NOW,
  });
}

async function seedBancoNeverSynced(db: Database, user: TwoUsers["userA"]): Promise<string> {
  const { connectionId } = await seedSyncedConnection(db, user, {
    assignTo: householdScope(user.session),
    itemId: FAKE_ITEM_BANCO_FIXTURE,
    accounts: [
      seedAccount({ providerAccountId: FIXTURE_CHECKING, providerItemId: FAKE_ITEM_BANCO_FIXTURE }),
    ],
  });
  await db
    .update(bankConnection)
    .set({ lastSyncedAt: null })
    .where(eq(bankConnection.id, connectionId));
  return connectionId;
}

function recordingProvider(windows: string[]): DataProvider {
  return {
    name: "fake",
    async authenticate(credentials) {
      const real = await deps.provider.authenticate(credentials);
      if (real.status !== "ok") {
        return real;
      }
      const client = real.client;
      return {
        status: "ok",
        client: {
          describeConnection: (itemId) => client.describeConnection(itemId),
          listAccounts: (itemId) => client.listAccounts(itemId),
          listInvestmentPositions: (itemId) => client.listInvestmentPositions(itemId),
          listTransactionsSince: (accountId, since) => {
            windows.push(since);
            return client.listTransactionsSince(accountId, since);
          },
        },
      };
    },
  };
}

async function transactionsOf(db: Database, connectionId: string) {
  return db
    .select({
      providerTransactionId: bankTransaction.providerTransactionId,
      amountCentavos: bankTransaction.amountCentavos,
      date: bankTransaction.date,
    })
    .from(bankTransaction)
    .innerJoin(bankAccount, eq(bankAccount.id, bankTransaction.accountId))
    .where(eq(bankAccount.connectionId, connectionId))
    .orderBy(bankTransaction.date);
}

async function connectionRow(db: Database, connectionId: string) {
  const [row] = await db
    .select({
      lastSyncedAt: bankConnection.lastSyncedAt,
      lastSyncError: bankConnection.lastSyncError,
    })
    .from(bankConnection)
    .where(eq(bankConnection.id, connectionId));
  return row;
}

describe("syncAllConnections (integration)", () => {
  it("does nothing, successfully, when no connection exists", async () => {
    await withTwoUsers(async ({ db }) => {
      await expect(syncAllConnections(db, deps, NOW)).resolves.toEqual({
        ok: true,
        synced: 0,
        failed: 0,
      });
    });
  });

  it("pulls twelve months on the first sync, refreshes accounts and never duplicates on re-run", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await saveCredentials(db, userA);
      const connectionId = await seedBancoNeverSynced(db, userA);

      await expect(syncAllConnections(db, deps, NOW)).resolves.toEqual({
        ok: true,
        synced: 1,
        failed: 0,
      });

      expect(await transactionsOf(db, connectionId)).toEqual([
        {
          providerTransactionId: "c1000000-0000-4000-8000-000000000001",
          amountCentavos: 850000,
          date: "2026-09-15",
        },
        {
          providerTransactionId: "c1000000-0000-4000-8000-000000000002",
          amountCentavos: -98050,
          date: "2026-09-16",
        },
        {
          providerTransactionId: "c1000000-0000-4000-8000-000000000003",
          amountCentavos: -21230,
          date: "2026-09-17",
        },
      ]);
      expect(await connectionRow(db, connectionId)).toEqual({
        lastSyncedAt: NOW,
        lastSyncError: null,
      });
      const accounts = await createHouseholdAccountsRepository(
        householdScope(userA.session),
        userA.scope,
      ).list(db);
      expect(accounts).toHaveLength(6);
      expect(accounts.find((account) => account.name === "Conta corrente")?.balanceCentavos).toBe(
        123456,
      );

      const later = new Date(NOW.getTime() + 24 * 60 * 60 * 1000);
      await expect(syncAllConnections(db, deps, later)).resolves.toMatchObject({ synced: 1 });
      expect(await transactionsOf(db, connectionId)).toHaveLength(3);
      expect((await connectionRow(db, connectionId))?.lastSyncedAt).toEqual(later);
    });
  });

  it("reads only from a week before the last sync once the ledger holds history", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await saveCredentials(db, userA);
      const connectionId = await seedBancoNeverSynced(db, userA);
      await syncAllConnections(db, deps, NOW);
      await db
        .update(bankConnection)
        .set({ lastSyncedAt: new Date("2026-09-30T06:00:00.000Z") })
        .where(eq(bankConnection.id, connectionId));

      const windows: string[] = [];
      await syncAllConnections(
        db,
        { ...deps, provider: recordingProvider(windows) },
        new Date("2026-10-01T06:00:00.000Z"),
      );

      expect(windows).toContain("2026-09-23");
      expect(windows).not.toContain("2025-10-01");
    });
  });

  // The connections made before the transactions table shipped carry a
  // successful sync time and no transactions; keying the backfill on the last
  // sync time alone would leave their history permanently unreachable.
  it("pulls twelve months for a connection synced before transactions were stored", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await saveCredentials(db, userA);
      const connectionId = await seedBancoNeverSynced(db, userA);
      await db
        .update(bankConnection)
        .set({ lastSyncedAt: new Date("2026-09-30T06:00:00.000Z") })
        .where(eq(bankConnection.id, connectionId));

      const windows: string[] = [];
      await expect(
        syncAllConnections(
          db,
          { ...deps, provider: recordingProvider(windows) },
          new Date("2026-10-01T06:00:00.000Z"),
        ),
      ).resolves.toMatchObject({ synced: 1 });

      expect(windows).toContain("2025-10-01");
      expect(await transactionsOf(db, connectionId)).toHaveLength(3);
    });
  });

  it("assigns an account the provider starts listing to the household of its siblings", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await saveCredentials(db, userA);
      await seedBancoNeverSynced(db, userA);

      await syncAllConnections(db, deps, NOW);

      const visibleToA = await createHouseholdAccountsRepository(
        householdScope(userA.session),
        userA.scope,
      ).list(db);
      const visibleToB = await createHouseholdAccountsRepository(
        householdScope(userB.session),
        userB.scope,
      ).list(db);
      expect(visibleToA.map((account) => account.name)).toContain("Poupança");
      expect(visibleToB).toEqual([]);
    });
  });

  it("records why a connection failed, keeps its data and last sync time, and still syncs the others", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await saveCredentials(db, userA);
      const healthy = await seedBancoNeverSynced(db, userA);
      await saveCredentials(db, userB, FAKE_INVALID_CLIENT_SECRET);
      const rejected = await seedBancoNeverSynced(db, userB);

      await expect(syncAllConnections(db, deps, NOW)).resolves.toEqual({
        ok: true,
        synced: 1,
        failed: 1,
      });

      expect(await connectionRow(db, rejected)).toEqual({
        lastSyncedAt: null,
        lastSyncError: "invalid_credentials",
      });
      expect(await transactionsOf(db, rejected)).toEqual([]);
      expect(await transactionsOf(db, healthy)).toHaveLength(3);
    });
  });

  it("reports missing, unreadable and refused provider access without touching the data", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const missing = await seedBancoNeverSynced(db, userA);
      await createSyncUserRepository(userB.scope).saveCredential(db, {
        provider: "pluggy",
        ciphertext: "enc:v1:not-a-real-envelope",
        validatedAt: NOW,
      });
      const unreadable = await seedBancoNeverSynced(db, userB);

      await expect(syncAllConnections(db, deps, NOW)).resolves.toEqual({
        ok: false,
        synced: 0,
        failed: 2,
      });
      expect((await connectionRow(db, missing))?.lastSyncError).toBe("no_credentials");
      expect((await connectionRow(db, unreadable))?.lastSyncError).toBe("credentials_unreadable");

      await saveCredentials(db, userA);
      const previousSync = new Date("2026-09-20T06:00:00.000Z");
      await db
        .update(bankConnection)
        .set({ lastSyncedAt: previousSync })
        .where(eq(bankConnection.id, missing));
      const offline: DataProvider = {
        name: "fake",
        async authenticate(credentials) {
          const real = await deps.provider.authenticate(credentials);
          if (real.status !== "ok") {
            return real;
          }
          return {
            status: "ok",
            client: {
              describeConnection: (itemId) => real.client.describeConnection(itemId),
              listInvestmentPositions: (itemId) => real.client.listInvestmentPositions(itemId),
              listTransactionsSince: (accountId, since) =>
                real.client.listTransactionsSince(accountId, since),
              listAccounts: () => Promise.reject(new ProviderUnavailableError("down", 503)),
            },
          };
        },
      };

      await syncAllConnections(db, { ...deps, provider: offline }, NOW);

      expect(await connectionRow(db, missing)).toEqual({
        lastSyncedAt: previousSync,
        lastSyncError: "provider_unavailable",
      });
      expect(await transactionsOf(db, missing)).toEqual([]);
    });
  });

  // Pluggy answers a manual update of a Meu Pluggy proxy item with a 400, so a
  // run that asks for one syncs nothing at all (ADR-0005).
  it("syncs through a client that exposes reads only", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await saveCredentials(db, userA);
      const connectionId = await seedBancoNeverSynced(db, userA);
      const authenticated = await deps.provider.authenticate({
        clientId: "id",
        clientSecret: "client-secret",
      });
      if (authenticated.status !== "ok") throw new Error("fake provider refused");
      const real = authenticated.client;
      const readsOnly: DataProvider = {
        name: "fake",
        authenticate: () =>
          Promise.resolve({
            status: "ok",
            client: {
              describeConnection: (itemId) => real.describeConnection(itemId),
              listAccounts: (itemId) => real.listAccounts(itemId),
              listInvestmentPositions: (itemId) => real.listInvestmentPositions(itemId),
              listTransactionsSince: (accountId, since) =>
                real.listTransactionsSince(accountId, since),
            },
          }),
      };

      await expect(syncAllConnections(db, { ...deps, provider: readsOnly }, NOW)).resolves.toEqual({
        ok: true,
        synced: 1,
        failed: 0,
      });
      expect(await transactionsOf(db, connectionId)).not.toEqual([]);
    });
  });
});
