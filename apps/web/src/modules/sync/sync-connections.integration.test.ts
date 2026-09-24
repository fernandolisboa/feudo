import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { householdScope } from "@/modules/households";

import { encryptSecret } from "./crypto";
import { createDocumentHasher } from "./document-hash";
import { FAKE_INVALID_CLIENT_SECRET, FAKE_ITEM_BANCO_FIXTURE } from "./provider/fake-fixtures";
import { createFakeProvider } from "./provider/fake-provider";
import { ProviderReadAbortedError, ProviderUnavailableError } from "./provider/provider";
import {
  createHouseholdAccountsRepository,
  createSyncUserRepository,
  listConnectionsToSync,
} from "./repository";
import { bankAccount, bankConnection, bankTransaction } from "./schema";
import { syncAllConnections, type SyncDeps } from "./service";
import { seedAccount, seedSyncedConnection } from "./test/seed-synced-connection";
import { withTwoUsers, type TwoUsers } from "./test/with-two-users";

import type { Database } from "@/platform/db/client";
import type { AuthenticateOutcome, DataProvider, ProviderCredentials } from "./provider/provider";

const ENCRYPTION_KEY = "integration-test-encryption-key-with-32-chars";
const deps: SyncDeps = {
  provider: createFakeProvider(createDocumentHasher("integration-test-document-hash-key-32ch!")),
  encryptionKey: ENCRYPTION_KEY,
};
const NOW = new Date("2026-09-22T06:00:00.000Z");
// Real time, not NOW: syncAllConnections defaults its clock to the real one
// whenever a test doesn't inject its own, and only the timing-focused tests
// below care about the deadline at all.
const AMPLE_DEADLINE = new Date(Date.now() + 5 * 60_000);
const FIXTURE_CHECKING = "a1000000-0000-4000-8000-000000000001";
const OTHER_ITEM = "other-item-fixture";
const OTHER_ACCOUNT = "other-account-fixture";

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

async function seedNeverSynced(
  db: Database,
  user: TwoUsers["userA"],
  itemId: string,
  accountId: string,
): Promise<string> {
  const { connectionId } = await seedSyncedConnection(db, user, {
    assignTo: householdScope(user.session),
    itemId,
    accounts: [seedAccount({ providerAccountId: accountId, providerItemId: itemId })],
  });
  await db
    .update(bankConnection)
    .set({ lastSyncedAt: null })
    .where(eq(bankConnection.id, connectionId));
  return connectionId;
}

async function seedBancoNeverSynced(db: Database, user: TwoUsers["userA"]): Promise<string> {
  return seedNeverSynced(db, user, FAKE_ITEM_BANCO_FIXTURE, FIXTURE_CHECKING);
}

function recordingProvider(windows: string[]): DataProvider {
  return {
    name: "fake",
    async authenticate(credentials, options): Promise<AuthenticateOutcome> {
      const real = await deps.provider.authenticate(credentials, options);
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
      await expect(
        syncAllConnections(db, deps, { now: NOW, deadline: AMPLE_DEADLINE }),
      ).resolves.toEqual({
        ok: true,
        synced: 0,
        failed: 0,
        gone: 0,
        unreached: 0,
      });
    });
  });

  it("pulls twelve months on the first sync, refreshes accounts and never duplicates on re-run", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await saveCredentials(db, userA);
      const connectionId = await seedBancoNeverSynced(db, userA);

      await expect(
        syncAllConnections(db, deps, { now: NOW, deadline: AMPLE_DEADLINE }),
      ).resolves.toEqual({
        ok: true,
        synced: 1,
        failed: 0,
        gone: 0,
        unreached: 0,
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
      await expect(
        syncAllConnections(db, deps, { now: later, deadline: AMPLE_DEADLINE }),
      ).resolves.toMatchObject({
        synced: 1,
      });
      expect(await transactionsOf(db, connectionId)).toHaveLength(3);
      expect((await connectionRow(db, connectionId))?.lastSyncedAt).toEqual(later);
    });
  });

  it("reads only from a week before the last sync once the ledger holds history", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await saveCredentials(db, userA);
      const connectionId = await seedBancoNeverSynced(db, userA);
      await syncAllConnections(db, deps, { now: NOW, deadline: AMPLE_DEADLINE });
      await db
        .update(bankConnection)
        .set({ lastSyncedAt: new Date("2026-09-30T06:00:00.000Z") })
        .where(eq(bankConnection.id, connectionId));

      const windows: string[] = [];
      await syncAllConnections(
        db,
        { ...deps, provider: recordingProvider(windows) },
        { now: new Date("2026-10-01T06:00:00.000Z"), deadline: AMPLE_DEADLINE },
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
          { now: new Date("2026-10-01T06:00:00.000Z"), deadline: AMPLE_DEADLINE },
        ),
      ).resolves.toMatchObject({ synced: 1 });

      expect(windows).toContain("2025-10-01");
      expect(await transactionsOf(db, connectionId)).toHaveLength(3);
    });
  });

  it("asks for a narrowed window on a first sync retried after a too-long listing", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await saveCredentials(db, userA);
      const connectionId = await seedBancoNeverSynced(db, userA);
      await db
        .update(bankConnection)
        .set({ lastSyncError: "listing_too_long" })
        .where(eq(bankConnection.id, connectionId));

      const windows: string[] = [];
      await syncAllConnections(
        db,
        { ...deps, provider: recordingProvider(windows) },
        { now: NOW, deadline: AMPLE_DEADLINE },
      );

      expect(windows).toContain("2026-08-01");
      expect(windows).not.toContain("2025-09-01");
    });
  });

  it("assigns an account the provider starts listing to the household of its siblings", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await saveCredentials(db, userA);
      await seedBancoNeverSynced(db, userA);

      await syncAllConnections(db, deps, { now: NOW, deadline: AMPLE_DEADLINE });

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

      await expect(
        syncAllConnections(db, deps, { now: NOW, deadline: AMPLE_DEADLINE }),
      ).resolves.toEqual({
        ok: true,
        synced: 1,
        failed: 1,
        gone: 0,
        unreached: 0,
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

      await expect(
        syncAllConnections(db, deps, { now: NOW, deadline: AMPLE_DEADLINE }),
      ).resolves.toEqual({
        ok: false,
        synced: 0,
        failed: 2,
        gone: 0,
        unreached: 0,
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
        async authenticate(credentials, options): Promise<AuthenticateOutcome> {
          const real = await deps.provider.authenticate(credentials, options);
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

      await syncAllConnections(
        db,
        { ...deps, provider: offline },
        { now: NOW, deadline: AMPLE_DEADLINE },
      );

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

      await expect(
        syncAllConnections(
          db,
          { ...deps, provider: readsOnly },
          { now: NOW, deadline: AMPLE_DEADLINE },
        ),
      ).resolves.toEqual({ ok: true, synced: 1, failed: 0, gone: 0, unreached: 0 });
      expect(await transactionsOf(db, connectionId)).not.toEqual([]);
    });
  });

  it("counts a connection deleted mid-run as gone and still syncs the next one", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await saveCredentials(db, userA);
      const goneConnection = await seedBancoNeverSynced(db, userA);
      await saveCredentials(db, userB);
      const healthy = await seedNeverSynced(db, userB, OTHER_ITEM, OTHER_ACCOUNT);

      const deletingProvider: DataProvider = {
        name: "fake",
        async authenticate(credentials, options): Promise<AuthenticateOutcome> {
          const real = await deps.provider.authenticate(credentials, options);
          if (real.status !== "ok") {
            return real;
          }
          const client = real.client;
          return {
            status: "ok",
            client: {
              describeConnection: (itemId) => client.describeConnection(itemId),
              listAccounts: async (itemId) => {
                if (itemId === FAKE_ITEM_BANCO_FIXTURE) {
                  await db.delete(bankConnection).where(eq(bankConnection.id, goneConnection));
                }
                return client.listAccounts(itemId);
              },
              listInvestmentPositions: (itemId) => client.listInvestmentPositions(itemId),
              listTransactionsSince: (accountId, since) =>
                client.listTransactionsSince(accountId, since),
            },
          };
        },
      };

      await expect(
        syncAllConnections(
          db,
          { ...deps, provider: deletingProvider },
          { now: NOW, deadline: AMPLE_DEADLINE },
        ),
      ).resolves.toEqual({ ok: true, synced: 1, failed: 0, gone: 1, unreached: 0 });

      expect(await connectionRow(db, healthy)).toMatchObject({ lastSyncedAt: NOW });
    });
  });

  it("counts a connection as gone, not also failed, when the delete races the failure write", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await saveCredentials(db, userA, FAKE_INVALID_CLIENT_SECRET);
      const connectionId = await seedBancoNeverSynced(db, userA);

      const deletingOnRejection: DataProvider = {
        name: "fake",
        async authenticate(credentials, options): Promise<AuthenticateOutcome> {
          const outcome = await deps.provider.authenticate(credentials, options);
          if (outcome.status !== "ok") {
            // The row is gone by the time the loop gets to record the
            // failure it is about to return: recordSyncFailure must not have
            // already counted it as `failed` first (#79 x #75 interaction).
            await db.delete(bankConnection).where(eq(bankConnection.id, connectionId));
          }
          return outcome;
        },
      };

      await expect(
        syncAllConnections(
          db,
          { ...deps, provider: deletingOnRejection },
          { now: NOW, deadline: AMPLE_DEADLINE },
        ),
      ).resolves.toEqual({ ok: true, synced: 0, failed: 0, gone: 1, unreached: 0 });
    });
  });

  it("stops before the deadline and reports the rest unreached, without touching them", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await saveCredentials(db, userA);
      const first = await seedBancoNeverSynced(db, userA);
      await saveCredentials(db, userB);
      const second = await seedNeverSynced(db, userB, OTHER_ITEM, OTHER_ACCOUNT);

      // The deadline and clock share one made-up axis, unrelated to real
      // time: a 60000ms total budget gives the first connection its own
      // 30000ms slice (half the run), scheduling a real 30s AbortController
      // comfortably longer than this test takes (the `finally` clears it
      // before it ever fires), while the fake clock alone drives the
      // per-connection "is there still room" check.
      let calls = 0;
      const clock = () => {
        calls += 1;
        if (calls <= 2) return new Date(0); // run start, then connection 1's check: full budget left
        return new Date(50_000); // connection 2's check: only 10000ms left, below MIN_CONNECTION_SLICE_MS
      };

      await expect(
        syncAllConnections(db, deps, {
          now: NOW,
          deadline: new Date(60_000),
          clock,
        }),
      ).resolves.toEqual({ ok: true, synced: 1, failed: 0, gone: 0, unreached: 1 });

      expect((await connectionRow(db, first))?.lastSyncedAt).toEqual(NOW);
      expect(await connectionRow(db, second)).toEqual({ lastSyncedAt: null, lastSyncError: null });
    });
  });

  it("stops an in-flight read at the deadline, recording it as too_slow and writing nothing", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await saveCredentials(db, userA);
      const connectionId = await seedBancoNeverSynced(db, userA);

      let slowReadStarted = false;
      const abortingSoon: DataProvider = {
        name: "fake",
        async authenticate(
          credentials: ProviderCredentials,
          options?: { signal?: AbortSignal },
        ): Promise<AuthenticateOutcome> {
          const real = await deps.provider.authenticate(credentials, options);
          if (real.status !== "ok") {
            return real;
          }
          const client = real.client;
          return {
            status: "ok",
            client: {
              describeConnection: (itemId) => client.describeConnection(itemId),
              listAccounts: (itemId) => client.listAccounts(itemId),
              listInvestmentPositions: async (itemId) => {
                slowReadStarted = true;
                await new Promise((resolve) => setTimeout(resolve, 500));
                return client.listInvestmentPositions(itemId);
              },
              listTransactionsSince: (accountId, since) =>
                client.listTransactionsSince(accountId, since),
            },
          };
        },
      };

      // Real time only decides when this connection's own AbortController
      // fires (half of totalBudgetMs, a comfortable 150ms above ordinary
      // setup latency, so a real 75ms slice); the fake clock reports this
      // connection as starting with the whole run budget still ahead of it,
      // so the abort is on its own slow read (too_slow), not on where it
      // landed in the queue.
      const realStart = Date.now();
      let calls = 0;
      const clock = () => {
        calls += 1;
        return calls === 1 ? new Date(realStart) : new Date(realStart - 20_000);
      };

      await expect(
        syncAllConnections(
          db,
          { ...deps, provider: abortingSoon },
          { now: NOW, deadline: new Date(realStart + 150), clock },
        ),
      ).resolves.toEqual({ ok: false, synced: 0, failed: 1, gone: 0, unreached: 0 });

      expect(slowReadStarted).toBe(true);
      expect(await connectionRow(db, connectionId)).toEqual({
        lastSyncedAt: null,
        lastSyncError: "too_slow",
      });
      expect(await transactionsOf(db, connectionId)).toEqual([]);
    });
  });

  // providerSessionFor's authenticate() is itself a provider read: this
  // proves the service classifies an aborted one the same way as an aborted
  // in-flight read (recording a status, not letting the error escape into
  // runConnectionsSyncStep's `{ error }` shape) rather than exercising the
  // real AbortController's timing, which fake-provider.test.ts already
  // covers at the provider layer.
  it("counts a run aborted during authenticate as timed_out, without crashing the run", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await saveCredentials(db, userA);
      const connectionId = await seedBancoNeverSynced(db, userA);

      const abortingDuringAuth: DataProvider = {
        name: "fake",
        authenticate: () => Promise.reject(new ProviderReadAbortedError("auth")),
      };

      let calls = 0;
      const clock = () => {
        calls += 1;
        // Run start, then this connection's check: 20000ms left out of a
        // 100000ms total budget — less than half, so on its own this is
        // timed_out (where it landed in the queue), not too_slow.
        return calls === 1 ? new Date(0) : new Date(80_000);
      };

      await expect(
        syncAllConnections(
          db,
          { ...deps, provider: abortingDuringAuth },
          { now: NOW, deadline: new Date(100_000), clock },
        ),
      ).resolves.toEqual({ ok: false, synced: 0, failed: 1, gone: 0, unreached: 0 });

      expect(await connectionRow(db, connectionId)).toEqual({
        lastSyncedAt: null,
        lastSyncError: "timed_out",
      });
    });
  });

  // Round-2 fix for the starvation regression: a connection that goes slow at
  // the provider sorts first every day (its last sync time stops moving), so
  // without a per-connection bound it could hold the whole run's clock and
  // starve everything behind it forever (#75). Bounding each connection to at
  // most half the run means a stuck connection costs at most half a run.
  it("does not let a connection that is too slow two runs in a row block a healthy one behind it", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await saveCredentials(db, userA);
      const slow = await seedBancoNeverSynced(db, userA);
      await saveCredentials(db, userB);
      const healthy = await seedNeverSynced(db, userB, OTHER_ITEM, OTHER_ACCOUNT);

      const slowOnBanco: DataProvider = {
        name: "fake",
        async authenticate(credentials, options): Promise<AuthenticateOutcome> {
          const real = await deps.provider.authenticate(credentials, options);
          if (real.status !== "ok") {
            return real;
          }
          const client = real.client;
          return {
            status: "ok",
            client: {
              describeConnection: (itemId) => client.describeConnection(itemId),
              listAccounts: (itemId) => client.listAccounts(itemId),
              listInvestmentPositions: async (itemId) => {
                if (itemId === FAKE_ITEM_BANCO_FIXTURE) {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                }
                return client.listInvestmentPositions(itemId);
              },
              listTransactionsSince: (accountId, since) =>
                client.listTransactionsSince(accountId, since),
            },
          };
        },
      };

      // A small, self-consistent fake axis: a 300ms total budget makes each
      // connection's own slice a real 150ms, well under the slow
      // connection's 300ms read, so it is reliably too_slow without the
      // test waiting on the run's actual deadline. The fake clock reports
      // plenty of runway left on every per-connection floor check
      // (MIN_CONNECTION_SLICE_MS is about queue position, not this run's
      // small budget), which is what lets the healthy connection behind the
      // slow one still be attempted in the same run.
      function runOnce() {
        const axisStart = 1_000_000;
        let calls = 0;
        const clock = () => {
          calls += 1;
          return calls === 1 ? new Date(axisStart) : new Date(axisStart - 20_000);
        };
        return syncAllConnections(
          db,
          { ...deps, provider: slowOnBanco },
          { now: NOW, deadline: new Date(axisStart + 300), clock },
        );
      }

      await expect(runOnce()).resolves.toEqual({
        ok: true,
        synced: 1,
        failed: 1,
        gone: 0,
        unreached: 0,
      });
      expect((await connectionRow(db, slow))?.lastSyncError).toBe("too_slow");
      expect((await connectionRow(db, healthy))?.lastSyncedAt).toEqual(NOW);

      await expect(runOnce()).resolves.toEqual({
        ok: true,
        synced: 1,
        failed: 1,
        gone: 0,
        unreached: 0,
      });
      expect((await connectionRow(db, slow))?.lastSyncError).toBe("too_slow");
      expect((await connectionRow(db, healthy))?.lastSyncedAt).toEqual(NOW);
    });
  });
});

describe("listConnectionsToSync ordering (integration)", () => {
  it("lists a connection that failed last time after the healthy ones", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const failing = await seedBancoNeverSynced(db, userA);
      await db
        .update(bankConnection)
        .set({ lastSyncError: "provider_unavailable" })
        .where(eq(bankConnection.id, failing));
      const healthy = await seedNeverSynced(db, userB, OTHER_ITEM, OTHER_ACCOUNT);

      const ordered = await listConnectionsToSync(db);

      expect(ordered.map((connection) => connection.id)).toEqual([healthy, failing]);
    });
  });
});
