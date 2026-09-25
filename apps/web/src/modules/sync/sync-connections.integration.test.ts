import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { householdScope } from "@/modules/households";

import { encryptSecret } from "./crypto";
import { createDocumentHasher } from "./document-hash";
import { FAKE_INVALID_CLIENT_SECRET, FAKE_ITEM_BANCO_FIXTURE } from "./provider/fake-fixtures";
import { createFakeProvider } from "./provider/fake-provider";
import {
  ProviderListingTooLongError,
  ProviderReadAbortedError,
  ProviderUnavailableError,
} from "./provider/provider";
import {
  createHouseholdAccountsRepository,
  createSyncUserRepository,
  listConnectionsToSync,
} from "./repository";
import { bankAccount, bankConnection, bankTransaction } from "./schema";
import { syncAllConnections, type SyncDeps } from "./service";
import { seedAccount, seedSyncedConnection, seedTransaction } from "./test/seed-synced-connection";
import { withTwoUsers, type TwoUsers } from "./test/with-two-users";
import { narrowedFirstSyncSince, transactionsSince } from "./transactions-window";

import type { Database } from "@/platform/db/client";
import type { AuthenticateOutcome, DataProvider } from "./provider/provider";

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
const STUCK_ITEM_B = "stuck-item-b-fixture";
const STUCK_ACCOUNT_B = "stuck-account-b-fixture";

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

// Every read on a matched item waits precisely until the caller's own
// AbortController fires, instead of a fixed sleep: the abort is then exactly
// what ends the read, so the test cannot flake on how long a real provider
// call happens to take relative to a guessed sleep duration (advisory from
// round 3's review).
function slowOnItems(itemIds: ReadonlySet<string>): DataProvider {
  return {
    name: "fake",
    async authenticate(credentials, options): Promise<AuthenticateOutcome> {
      const real = await deps.provider.authenticate(credentials, options);
      if (real.status !== "ok") {
        return real;
      }
      const client = real.client;
      const signal = options?.signal;
      const waitForAbort = (): Promise<void> =>
        new Promise((resolve) => {
          if (signal?.aborted) {
            resolve();
            return;
          }
          signal?.addEventListener(
            "abort",
            () => {
              resolve();
            },
            { once: true },
          );
        });
      return {
        status: "ok",
        client: {
          describeConnection: (itemId) => client.describeConnection(itemId),
          listAccounts: (itemId) => client.listAccounts(itemId),
          listInvestmentPositions: async (itemId) => {
            if (itemIds.has(itemId)) {
              await waitForAbort();
            }
            return client.listInvestmentPositions(itemId);
          },
          listTransactionsSince: (accountId, since) =>
            client.listTransactionsSince(accountId, since),
        },
      };
    },
  };
}

// A first sync's listing that never stops offering pages, regardless of the
// window asked for: exercises the sticky-narrowing write on the
// ProviderListingTooLongError path (as opposed to slowOnItems, which
// exercises it on the ProviderReadAbortedError path).
const alwaysTooLong: DataProvider = {
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
        listTransactionsSince: (): Promise<never> => {
          throw new ProviderListingTooLongError("transactions");
        },
      },
    };
  },
};

// Rejects every authenticate() call outright: used to drive a plain
// timed_out (no in-flight read to abort, the connection's slice runs out
// before it is even attempted).
const abortingDuringAuth: DataProvider = {
  name: "fake",
  authenticate: () => Promise.reject(new ProviderReadAbortedError("auth")),
};

// Rejects a first read outright, with no real wait: classification is driven
// purely by the fake clock's hadFullSlice for whichever connection is being
// synced. Unlike abortingDuringAuth (aborting inside authenticate, before
// syncConnection is ever reached), the abort happens inside the read itself,
// so hasHistory is known and the narrowing decision (shouldNarrowFirstSync)
// actually runs — needed for any test that checks first_sync_since.
const immediatelyAbortedRead: DataProvider = {
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
        listAccounts: (): Promise<never> =>
          Promise.reject(new ProviderReadAbortedError("accounts")),
        listInvestmentPositions: (itemId) => client.listInvestmentPositions(itemId),
        listTransactionsSince: (accountId, since) => client.listTransactionsSince(accountId, since),
      },
    };
  },
};

// Throws a plain, uncategorized error from a read: none of syncConnection's
// specific catches match, so it is the kind of unexpected failure (a bug, a
// transient error the code doesn't have a name for) that per-connection
// containment must still turn into `failed` rather than let escape the run.
function throwingOnItem(itemId: string): DataProvider {
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
          describeConnection: (id) => client.describeConnection(id),
          listAccounts: (id) => {
            if (id === itemId) {
              return Promise.reject(new Error("boom"));
            }
            return client.listAccounts(id);
          },
          listInvestmentPositions: (id) => client.listInvestmentPositions(id),
          listTransactionsSince: (accountId, since) =>
            client.listTransactionsSince(accountId, since),
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

async function firstSyncSinceOf(db: Database, connectionId: string): Promise<string | null> {
  const [row] = await db
    .select({ firstSyncSince: bankConnection.firstSyncSince })
    .from(bankConnection)
    .where(eq(bankConnection.id, connectionId));
  return row?.firstSyncSince ?? null;
}

async function lastSyncAttemptedAtOf(db: Database, connectionId: string): Promise<Date | null> {
  const [row] = await db
    .select({ lastSyncAttemptedAt: bankConnection.lastSyncAttemptedAt })
    .from(bankConnection)
    .where(eq(bankConnection.id, connectionId));
  return row?.lastSyncAttemptedAt ?? null;
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
      // Stamped from the run's own clock, not `now` (which only anchors the
      // sync windows): with no clock injected here that's the real one, so
      // it lands near the moment this test ran, not on NOW's fixed date.
      const attemptedAt = await lastSyncAttemptedAtOf(db, connectionId);
      expect(attemptedAt).not.toBeNull();
      expect(Math.abs((attemptedAt?.getTime() ?? 0) - Date.now())).toBeLessThan(30_000);
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

  // Once the provider has rejected a user's secret this run, every other
  // connection under the same user skips straight to invalid_credentials
  // rather than paying for another POST /auth that cannot end differently.
  it("asks the provider for invalid credentials only once per user, even with two connections", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await saveCredentials(db, userA, FAKE_INVALID_CLIENT_SECRET);
      await seedBancoNeverSynced(db, userA);
      await seedNeverSynced(db, userA, OTHER_ITEM, OTHER_ACCOUNT);

      let authenticateCalls = 0;
      const countingProvider: DataProvider = {
        name: "fake",
        authenticate(credentials, options) {
          authenticateCalls += 1;
          return deps.provider.authenticate(credentials, options);
        },
      };

      await expect(
        syncAllConnections(
          db,
          { ...deps, provider: countingProvider },
          { now: NOW, deadline: AMPLE_DEADLINE },
        ),
      ).resolves.toEqual({ ok: false, synced: 0, failed: 2, gone: 0, unreached: 0 });

      expect(authenticateCalls).toBe(1);
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

      // Real time only decides when this connection's own AbortController
      // fires (half of totalBudgetMs, a 1000ms slice — ample margin over a
      // couple of Neon round trips so ordinary CI latency cannot flip the
      // classification); the fake clock reports this connection as starting
      // with the whole run budget still ahead of it, so the abort is on its
      // own slow read (too_slow), not on where it landed in the queue. The
      // read itself waits on the abort signal rather than a fixed sleep, so
      // it ends exactly when the timer fires, never sooner or later.
      const realStart = Date.now();
      let calls = 0;
      const clock = () => {
        calls += 1;
        return calls === 1 ? new Date(realStart) : new Date(realStart - 20_000);
      };

      await expect(
        syncAllConnections(
          db,
          { ...deps, provider: slowOnItems(new Set([FAKE_ITEM_BANCO_FIXTURE])) },
          { now: NOW, deadline: new Date(realStart + 2000), clock },
        ),
      ).resolves.toEqual({ ok: false, synced: 0, failed: 1, gone: 0, unreached: 0 });

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
      expect(await firstSyncSinceOf(db, connectionId)).toBeNull();
    });
  });

  // Round-3 fix for the deeper starvation regression: ordering by
  // last_sync_error/last_synced_at never advances on a repeated failure, so
  // even two stuck connections at the head of the queue could take the
  // whole run every day. Ordering by last_sync_attempted_at instead means
  // every connection rotates regardless of how its last attempt ended, and
  // each stuck connection still costs at most half the run's budget.
  it("does not let two connections that are too slow, two runs in a row, block a healthy one behind them", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await saveCredentials(db, userA);
      const stuckA = await seedBancoNeverSynced(db, userA);
      const stuckB = await seedNeverSynced(db, userA, STUCK_ITEM_B, STUCK_ACCOUNT_B);
      await saveCredentials(db, userB);
      const healthy = await seedNeverSynced(db, userB, OTHER_ITEM, OTHER_ACCOUNT);

      const bothStuck = slowOnItems(new Set([FAKE_ITEM_BANCO_FIXTURE, STUCK_ITEM_B]));

      // A small, self-consistent fake axis: a 2000ms total budget gives each
      // connection its own 1000ms slice, ample margin over a couple of Neon
      // round trips. The fake clock reports plenty of runway left on every
      // per-connection floor check (MIN_CONNECTION_SLICE_MS is about queue
      // position, not this run's small budget), which is what lets the
      // healthy connection behind two stuck ones still be attempted in the
      // same run.
      function runOnce() {
        const axisStart = 1_000_000;
        let calls = 0;
        const clock = () => {
          calls += 1;
          return calls === 1 ? new Date(axisStart) : new Date(axisStart - 20_000);
        };
        return syncAllConnections(
          db,
          { ...deps, provider: bothStuck },
          { now: NOW, deadline: new Date(axisStart + 2000), clock },
        );
      }

      await expect(runOnce()).resolves.toEqual({
        ok: true,
        synced: 1,
        failed: 2,
        gone: 0,
        unreached: 0,
      });
      expect((await connectionRow(db, stuckA))?.lastSyncError).toBe("too_slow");
      expect((await connectionRow(db, stuckB))?.lastSyncError).toBe("too_slow");
      expect((await connectionRow(db, healthy))?.lastSyncedAt).toEqual(NOW);

      await expect(runOnce()).resolves.toEqual({
        ok: true,
        synced: 1,
        failed: 2,
        gone: 0,
        unreached: 0,
      });
      expect((await connectionRow(db, stuckA))?.lastSyncError).toBe("too_slow");
      expect((await connectionRow(db, stuckB))?.lastSyncError).toBe("too_slow");
      expect((await connectionRow(db, healthy))?.lastSyncedAt).toEqual(NOW);
    });
  });

  // Round-4 fix: an unexpected error (a bug, a transient failure the code
  // has no name for) inside one connection's turn used to escape all the way
  // out of syncAllConnections and turn the whole run into runConnectionsSyncStep's
  // opaque `{ error }`, hiding every connection that would otherwise have
  // synced fine. It is now this one connection's problem alone.
  it("contains an unexpected per-connection error, counts it failed, and still syncs the others", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await saveCredentials(db, userA);
      const buggy = await seedBancoNeverSynced(db, userA);
      await saveCredentials(db, userB);
      const healthy = await seedNeverSynced(db, userB, OTHER_ITEM, OTHER_ACCOUNT);

      await expect(
        syncAllConnections(
          db,
          { ...deps, provider: throwingOnItem(FAKE_ITEM_BANCO_FIXTURE) },
          { now: NOW, deadline: AMPLE_DEADLINE },
        ),
      ).resolves.toEqual({ ok: true, synced: 1, failed: 1, gone: 0, unreached: 0 });

      expect((await connectionRow(db, healthy))?.lastSyncedAt).toEqual(NOW);
      expect(await connectionRow(db, buggy)).toEqual({ lastSyncedAt: null, lastSyncError: null });
    });
  });

  describe("sticky narrowing memory (#84)", () => {
    it("narrows a first sync's window after it was too_slow", async () => {
      await withTwoUsers(async ({ db, userA }) => {
        await saveCredentials(db, userA);
        const connectionId = await seedBancoNeverSynced(db, userA);

        const realStart = Date.now();
        let calls = 0;
        const clock = () => {
          calls += 1;
          return calls === 1 ? new Date(realStart) : new Date(realStart - 20_000);
        };
        await expect(
          syncAllConnections(
            db,
            { ...deps, provider: slowOnItems(new Set([FAKE_ITEM_BANCO_FIXTURE])) },
            { now: NOW, deadline: new Date(realStart + 2000), clock },
          ),
        ).resolves.toMatchObject({ failed: 1 });
        expect((await connectionRow(db, connectionId))?.lastSyncError).toBe("too_slow");
        expect(await firstSyncSinceOf(db, connectionId)).toBe(narrowedFirstSyncSince(NOW));

        const windows: string[] = [];
        const later = new Date(NOW.getTime() + 24 * 60 * 60 * 1000);
        await syncAllConnections(
          db,
          { ...deps, provider: recordingProvider(windows) },
          { now: later, deadline: AMPLE_DEADLINE },
        );

        expect(windows).toContain(narrowedFirstSyncSince(NOW));
        expect(windows).not.toContain(transactionsSince(later, null));
      });
    });

    it("narrows a first sync's window after a listing too long to page through", async () => {
      await withTwoUsers(async ({ db, userA }) => {
        await saveCredentials(db, userA);
        const connectionId = await seedBancoNeverSynced(db, userA);

        await expect(
          syncAllConnections(
            db,
            { ...deps, provider: alwaysTooLong },
            { now: NOW, deadline: AMPLE_DEADLINE },
          ),
        ).resolves.toMatchObject({ failed: 1 });
        expect((await connectionRow(db, connectionId))?.lastSyncError).toBe("listing_too_long");
        expect(await firstSyncSinceOf(db, connectionId)).toBe(narrowedFirstSyncSince(NOW));

        const windows: string[] = [];
        await syncAllConnections(
          db,
          { ...deps, provider: recordingProvider(windows) },
          { now: NOW, deadline: AMPLE_DEADLINE },
        );

        expect(windows).toContain(narrowedFirstSyncSince(NOW));
      });
    });

    it("does not narrow a first sync's window after a plain timed_out", async () => {
      await withTwoUsers(async ({ db, userA }) => {
        await saveCredentials(db, userA);
        const connectionId = await seedBancoNeverSynced(db, userA);

        let calls = 0;
        const clock = () => {
          calls += 1;
          return calls === 1 ? new Date(0) : new Date(80_000);
        };
        await expect(
          syncAllConnections(
            db,
            { ...deps, provider: immediatelyAbortedRead },
            { now: NOW, deadline: new Date(100_000), clock },
          ),
        ).resolves.toMatchObject({ failed: 1 });
        expect((await connectionRow(db, connectionId))?.lastSyncError).toBe("timed_out");
        expect(await firstSyncSinceOf(db, connectionId)).toBeNull();

        const windows: string[] = [];
        await syncAllConnections(
          db,
          { ...deps, provider: recordingProvider(windows) },
          { now: NOW, deadline: AMPLE_DEADLINE },
        );

        expect(windows).toContain(transactionsSince(NOW, null));
      });
    });

    it("keeps a first sync narrowed even after a later plain timed_out", async () => {
      await withTwoUsers(async ({ db, userA }) => {
        await saveCredentials(db, userA);
        const connectionId = await seedBancoNeverSynced(db, userA);

        const realStart = Date.now();
        let slowCalls = 0;
        const slowClock = () => {
          slowCalls += 1;
          return slowCalls === 1 ? new Date(realStart) : new Date(realStart - 20_000);
        };
        await syncAllConnections(
          db,
          { ...deps, provider: slowOnItems(new Set([FAKE_ITEM_BANCO_FIXTURE])) },
          { now: NOW, deadline: new Date(realStart + 2000), clock: slowClock },
        );
        expect(await firstSyncSinceOf(db, connectionId)).toBe(narrowedFirstSyncSince(NOW));

        let timedOutCalls = 0;
        const timedOutClock = () => {
          timedOutCalls += 1;
          return timedOutCalls === 1 ? new Date(0) : new Date(80_000);
        };
        await expect(
          syncAllConnections(
            db,
            { ...deps, provider: immediatelyAbortedRead },
            { now: NOW, deadline: new Date(100_000), clock: timedOutClock },
          ),
        ).resolves.toMatchObject({ failed: 1 });
        expect((await connectionRow(db, connectionId))?.lastSyncError).toBe("timed_out");
        expect(await firstSyncSinceOf(db, connectionId)).toBe(narrowedFirstSyncSince(NOW));

        const windows: string[] = [];
        await syncAllConnections(
          db,
          { ...deps, provider: recordingProvider(windows) },
          { now: NOW, deadline: AMPLE_DEADLINE },
        );

        expect(windows).toContain(narrowedFirstSyncSince(NOW));
      });
    });

    // Round-4 fix: a first sync queued behind a stuck connection got
    // slightly less than a full slice every run — too_slow was excluded from
    // that budget by definition, so it was always classified timed_out, and
    // a lone timed_out never narrowed. The run then repeated identically
    // forever. Two consecutive deadline aborts (this one timed_out, the
    // previous one too_slow or timed_out, read off the row before this run's
    // own outcome overwrites it) now narrow, breaking the loop.
    it("narrows a first sync after two consecutive deadline aborts, even when it is never too_slow itself", async () => {
      await withTwoUsers(async ({ db, userA, userB }) => {
        await saveCredentials(db, userA);
        const stuck = await seedSyncedConnection(db, userA, {
          assignTo: householdScope(userA.session),
          itemId: FAKE_ITEM_BANCO_FIXTURE,
          accounts: [
            seedAccount({
              providerAccountId: FIXTURE_CHECKING,
              providerItemId: FAKE_ITEM_BANCO_FIXTURE,
            }),
          ],
          transactions: [seedTransaction()],
        }).then(({ connectionId }) => connectionId);
        await saveCredentials(db, userB);
        const firstSync = await seedNeverSynced(db, userB, OTHER_ITEM, OTHER_ACCOUNT);

        // Both connections' reads abort immediately, so no real time is
        // spent waiting: classification is decided entirely by the fake
        // clock. `stuck` (has history) always gets the full slice
        // (too_slow); `firstSync` always gets slightly less (timed_out) —
        // exactly the trace the finding describes, with no dependence on
        // real scheduling overhead to reproduce it.
        function runOnce() {
          const axisStart = 1_000_000;
          let calls = 0;
          const clock = () => {
            calls += 1;
            if (calls === 1) return new Date(axisStart);
            if (calls === 2) return new Date(axisStart); // stuck: full 100000ms budget left
            return new Date(axisStart + 60_000); // firstSync: 40000ms left, under the 50000ms half
          };
          return syncAllConnections(
            db,
            { ...deps, provider: immediatelyAbortedRead },
            { now: NOW, deadline: new Date(axisStart + 100_000), clock },
          );
        }

        await runOnce();
        expect((await connectionRow(db, stuck))?.lastSyncError).toBe("too_slow");
        expect((await connectionRow(db, firstSync))?.lastSyncError).toBe("timed_out");
        expect(await firstSyncSinceOf(db, firstSync)).toBeNull();

        await runOnce();
        expect((await connectionRow(db, firstSync))?.lastSyncError).toBe("timed_out");
        expect(await firstSyncSinceOf(db, firstSync)).toBe(narrowedFirstSyncSince(NOW));

        const windows: string[] = [];
        await syncAllConnections(
          db,
          { ...deps, provider: recordingProvider(windows) },
          { now: NOW, deadline: AMPLE_DEADLINE },
        );

        expect(windows).toContain(narrowedFirstSyncSince(NOW));
        expect(windows).not.toContain(transactionsSince(NOW, null));
      });
    });
  });
});

describe("listConnectionsToSync ordering (integration)", () => {
  it("orders by when a connection was last attempted, not by its last outcome", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const attemptedLongAgo = await seedBancoNeverSynced(db, userA);
      await db
        .update(bankConnection)
        .set({
          lastSyncError: "provider_unavailable",
          lastSyncAttemptedAt: new Date("2026-09-01T00:00:00.000Z"),
        })
        .where(eq(bankConnection.id, attemptedLongAgo));
      const attemptedRecently = await seedNeverSynced(db, userB, OTHER_ITEM, OTHER_ACCOUNT);
      await db
        .update(bankConnection)
        .set({ lastSyncAttemptedAt: new Date("2026-09-20T00:00:00.000Z") })
        .where(eq(bankConnection.id, attemptedRecently));
      const neverAttempted = await seedNeverSynced(db, userA, STUCK_ITEM_B, STUCK_ACCOUNT_B);

      const ordered = await listConnectionsToSync(db);

      expect(ordered.map((connection) => connection.id)).toEqual([
        neverAttempted,
        attemptedLongAgo,
        attemptedRecently,
      ]);
    });
  });

  it("falls back to creation order among connections never attempted", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const first = await seedBancoNeverSynced(db, userA);
      const second = await seedNeverSynced(db, userB, OTHER_ITEM, OTHER_ACCOUNT);

      const ordered = await listConnectionsToSync(db);

      expect(ordered.map((connection) => connection.id)).toEqual([first, second]);
    });
  });
});
