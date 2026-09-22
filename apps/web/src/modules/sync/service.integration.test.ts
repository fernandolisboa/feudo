import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { householdScope } from "@/modules/households";

import { CONSENT_SCOPE_VERSION } from "./consent-text";
import { createDocumentHasher } from "./document-hash";
import {
  FAKE_INVALID_CLIENT_SECRET,
  FAKE_ITEM_BANCO_FIXTURE,
  FAKE_ITEM_CORRETORA_FIXTURE,
} from "./provider/fake-fixtures";
import { createFakeProvider } from "./provider/fake-provider";
import { createHouseholdAccountsRepository, createSyncUserRepository } from "./repository";
import {
  bankConnection,
  bankConnectionConsent,
  bankTransaction,
  providerCredential,
} from "./schema";
import {
  AUTH_ATTEMPTS_PER_WINDOW,
  acceptConsent,
  addConnection,
  connectProvider,
  deleteConnection,
  relabelAccount,
  removeCredentials,
  type SyncDeps,
} from "./service";
import { withTwoUsers, type TwoUsers } from "./test/with-two-users";

import type { Database } from "@/platform/db/client";
import type { DataProvider, ProviderClient } from "./provider/provider";

const ENCRYPTION_KEY = "integration-test-encryption-key-with-32-chars";
const deps: SyncDeps = {
  provider: createFakeProvider(createDocumentHasher("integration-test-document-hash-key-32ch!")),
  encryptionKey: ENCRYPTION_KEY,
};
const credentials = { clientId: "client-id", clientSecret: "client-secret" };

async function consentFor(db: Database, user: TwoUsers["userA"]): Promise<string> {
  const outcome = await acceptConsent(user.session, db);
  if (outcome.status !== "ok") {
    throw new Error("consent failed");
  }
  return outcome.consentId;
}

async function connectBanco(db: Database, user: TwoUsers["userA"]) {
  return connectProvider(
    {
      ...credentials,
      consentId: await consentFor(db, user),
      providerItemId: FAKE_ITEM_BANCO_FIXTURE,
    },
    user.session,
    db,
    deps,
  );
}

describe("connectProvider (integration)", () => {
  it("records the consent with the scope text shown and refuses a connection without it", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const consentId = await consentFor(db, userA);
      const [row] = await db
        .select()
        .from(bankConnectionConsent)
        .where(eq(bankConnectionConsent.id, consentId));
      expect(row).toMatchObject({ userId: userA.id, scopeVersion: CONSENT_SCOPE_VERSION });
      expect(row?.scopeText).toContain("Meu Pluggy");
      expect(row?.acceptedAt).toBeInstanceOf(Date);

      const outcome = await connectProvider(
        { ...credentials, consentId: "missing", providerItemId: FAKE_ITEM_BANCO_FIXTURE },
        userA.session,
        db,
        deps,
      );
      expect(outcome).toEqual({ status: "consent_required" });
    });
  });

  it("refuses a consent older than a day and another user's consent", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const stale = await consentFor(db, userA);
      await db
        .update(bankConnectionConsent)
        .set({ acceptedAt: new Date(Date.now() - 25 * 60 * 60 * 1000) })
        .where(eq(bankConnectionConsent.id, stale));
      const someoneElses = await consentFor(db, userB);

      for (const consentId of [stale, someoneElses]) {
        const outcome = await connectProvider(
          { ...credentials, consentId, providerItemId: FAKE_ITEM_BANCO_FIXTURE },
          userA.session,
          db,
          deps,
        );
        expect(outcome).toEqual({ status: "consent_required" });
      }
    });
  });

  it("validates the credentials against the provider before saving anything", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const outcome = await connectProvider(
        {
          ...credentials,
          clientSecret: FAKE_INVALID_CLIENT_SECRET,
          consentId: await consentFor(db, userA),
          providerItemId: FAKE_ITEM_BANCO_FIXTURE,
        },
        userA.session,
        db,
        deps,
      );

      expect(outcome).toEqual({ status: "invalid_credentials" });
      expect(await createSyncUserRepository(userA.scope).getCredential(db)).toBeUndefined();
    });
  });

  it("stores the credentials encrypted, never in clear, and syncs the accounts into the household", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      const outcome = await connectBanco(db, userA);

      expect(outcome).toMatchObject({ status: "ok", accountsCount: 6 });
      const [stored] = await db.select().from(providerCredential);
      expect(stored?.userId).toBe(userA.id);
      expect(stored?.ciphertext.startsWith("enc:v1:")).toBe(true);
      expect(stored?.ciphertext).not.toContain(credentials.clientSecret);
      expect(stored?.ciphertext).not.toContain(credentials.clientId);

      const accounts = await createHouseholdAccountsRepository(
        householdScope(userA.session),
        userA.scope,
      ).list(db);
      expect(accounts).toHaveLength(6);
      expect(accounts.every((account) => account.label === "individual")).toBe(true);
      expect(accounts.every((account) => account.connectedByUserId === userA.id)).toBe(true);
      expect(accounts.map((account) => account.type).sort()).toEqual([
        "checking",
        "checking",
        "credit_card",
        "investment",
        "investment",
        "savings",
      ]);
      expect(accounts.find((account) => account.currency === "USD")?.name).toBe("Conta global");
      const [connection] = await createSyncUserRepository(userA.scope).listConnections(db);
      expect(connection).toMatchObject({ institutionName: "Banco Fixture", accountsCount: 6 });
      expect(connection?.lastSyncedAt).toBeInstanceOf(Date);
      expect(householdA).toBe(userA.session.householdId);
      const transactions = await db
        .select({
          amountCentavos: bankTransaction.amountCentavos,
          hash: bankTransaction.counterpartDocumentHash,
        })
        .from(bankTransaction)
        .orderBy(bankTransaction.date);
      expect(transactions.map((transaction) => transaction.amountCentavos)).toEqual([
        850000, -98050, -21230,
      ]);
      expect(transactions[0]?.hash).toMatch(/^[0-9a-f]{64}$/);
      expect(transactions[2]?.hash).toBeNull();
    });
  });

  it("refuses to reuse a consent that already backs a connection", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const consentId = await consentFor(db, userA);
      const first = await connectProvider(
        { ...credentials, consentId, providerItemId: FAKE_ITEM_BANCO_FIXTURE },
        userA.session,
        db,
        deps,
      );
      expect(first.status).toBe("ok");

      const replayed = await connectProvider(
        { ...credentials, consentId, providerItemId: FAKE_ITEM_CORRETORA_FIXTURE },
        userA.session,
        db,
        deps,
      );
      expect(replayed).toEqual({ status: "consent_required" });
    });
  });

  it("stops calling the provider once a user exhausts their attempts, per user", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      let providerCalls = 0;
      const countingProvider: DataProvider = {
        name: "fake",
        authenticate: async (input) => {
          providerCalls += 1;
          return deps.provider.authenticate(input);
        },
      };
      const countingDeps = { ...deps, provider: countingProvider };
      const consentId = await consentFor(db, userA);
      const attempt = (user: TwoUsers["userA"], consent: string) =>
        connectProvider(
          {
            ...credentials,
            clientSecret: FAKE_INVALID_CLIENT_SECRET,
            consentId: consent,
            providerItemId: FAKE_ITEM_BANCO_FIXTURE,
          },
          user.session,
          db,
          countingDeps,
        );

      for (let index = 0; index < AUTH_ATTEMPTS_PER_WINDOW; index += 1) {
        expect(await attempt(userA, consentId)).toEqual({ status: "invalid_credentials" });
      }
      expect(await attempt(userA, consentId)).toEqual({ status: "rate_limited" });
      expect(providerCalls).toBe(AUTH_ATTEMPTS_PER_WINDOW);

      expect(await attempt(userB, await consentFor(db, userB))).toEqual({
        status: "invalid_credentials",
      });
      expect(providerCalls).toBe(AUTH_ATTEMPTS_PER_WINDOW + 1);
    });
  });

  it("leaves no connection behind when the account write fails, and dedupes listings", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const okOutcome = await deps.provider.authenticate(credentials);
      if (okOutcome.status !== "ok") throw new Error("fake provider refused");
      const real = okOutcome.client;
      const withListAccounts = (listAccounts: ProviderClient["listAccounts"]): DataProvider => ({
        name: "fake",
        authenticate: () =>
          Promise.resolve({
            status: "ok",
            client: {
              describeConnection: (itemId) => real.describeConnection(itemId),
              listInvestmentPositions: (itemId) => real.listInvestmentPositions(itemId),
              listTransactionsSince: (accountId, since) =>
                real.listTransactionsSince(accountId, since),
              listAccounts,
            },
          }),
      });
      const brokenProvider = withListAccounts(async (itemId) => {
        const accounts = await real.listAccounts(itemId);
        const [first] = accounts;
        if (!first) throw new Error("fixture has no accounts");
        return [...accounts, { ...first, providerAccountId: "broken", dueDate: "not-a-date" }];
      });
      const outcome = await connectProvider(
        {
          ...credentials,
          consentId: await consentFor(db, userA),
          providerItemId: FAKE_ITEM_BANCO_FIXTURE,
        },
        userA.session,
        db,
        { ...deps, provider: brokenProvider },
      );

      expect(outcome).toEqual({ status: "failed" });
      expect(await db.select().from(bankConnection)).toEqual([]);

      const duplicatesOnly = withListAccounts(async (itemId) => {
        const accounts = await real.listAccounts(itemId);
        return [...accounts, ...accounts];
      });
      const deduped = await connectProvider(
        {
          ...credentials,
          consentId: await consentFor(db, userA),
          providerItemId: FAKE_ITEM_BANCO_FIXTURE,
        },
        userA.session,
        db,
        { ...deps, provider: duplicatesOnly },
      );
      expect(deduped.status).toBe("ok");
      expect(
        await createHouseholdAccountsRepository(householdScope(userA.session), userA.scope).list(
          db,
        ),
      ).toHaveLength(6);
    });
  });

  it("reports an unknown item and an item connected twice", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      expect(
        await connectProvider(
          {
            ...credentials,
            consentId: await consentFor(db, userA),
            providerItemId: "00000000-0000-4000-8000-000000000000",
          },
          userA.session,
          db,
          deps,
        ),
      ).toEqual({ status: "item_not_found" });

      expect((await connectBanco(db, userA)).status).toBe("ok");
      expect((await connectBanco(db, userA)).status).toBe("already_connected");
    });
  });
});

describe("addConnection, removeCredentials, deleteConnection, relabelAccount (integration)", () => {
  it("adds a second item with the stored credentials under a fresh consent", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      expect(
        await addConnection(
          { providerItemId: FAKE_ITEM_CORRETORA_FIXTURE },
          userA.session,
          db,
          deps,
        ),
      ).toEqual({
        status: "no_credentials",
      });
      await connectBanco(db, userA);

      const outcome = await addConnection(
        { providerItemId: FAKE_ITEM_CORRETORA_FIXTURE },
        userA.session,
        db,
        deps,
      );

      expect(outcome).toMatchObject({ status: "ok", accountsCount: 1 });
      const connections = await createSyncUserRepository(userA.scope).listConnections(db);
      expect(connections.map((connection) => connection.institutionName)).toEqual([
        "Banco Fixture",
        "Corretora Fixture",
      ]);
      expect(await createSyncUserRepository(userB.scope).listConnections(db)).toEqual([]);
    });
  });

  it("reports unreadable credentials without calling the provider, e.g. after a key rotation", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await connectBanco(db, userA);
      let providerCalls = 0;
      const countingProvider: DataProvider = {
        name: "fake",
        authenticate: async (input) => {
          providerCalls += 1;
          return deps.provider.authenticate(input);
        },
      };
      const rotatedKeyDeps: SyncDeps = {
        provider: countingProvider,
        encryptionKey: "another-integration-test-encryption-key-32c",
      };

      const outcome = await addConnection(
        { providerItemId: FAKE_ITEM_CORRETORA_FIXTURE },
        userA.session,
        db,
        rotatedKeyDeps,
      );

      expect(outcome).toEqual({ status: "credentials_unreadable" });
      expect(providerCalls).toBe(0);
    });
  });

  it("destroys the credentials but keeps connections and accounts until deleted", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await connectBanco(db, userA);
      const repository = createSyncUserRepository(userA.scope);

      expect(await removeCredentials(userA.session, db)).toEqual({ status: "ok" });
      expect(await removeCredentials(userA.session, db)).toEqual({ status: "not_found" });
      expect(await repository.getCredential(db)).toBeUndefined();
      expect(
        await createHouseholdAccountsRepository(householdScope(userA.session), userA.scope).list(
          db,
        ),
      ).toHaveLength(6);

      const [connection] = await repository.listConnections(db);
      expect(await deleteConnection(connection?.id ?? "", userA.session, db)).toEqual({
        status: "ok",
      });
      expect(
        await createHouseholdAccountsRepository(householdScope(userA.session), userA.scope).list(
          db,
        ),
      ).toEqual([]);
      expect(await deleteConnection(connection?.id ?? "", userA.session, db)).toEqual({
        status: "not_found",
      });
    });
  });

  it("lets only the connection owner relabel, inside their household", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await connectBanco(db, userA);
      const [account] = await createHouseholdAccountsRepository(
        householdScope(userA.session),
        userA.scope,
      ).list(db);
      const accountId = account?.id ?? "";

      expect(await relabelAccount({ accountId, label: "shared" }, userB.session, db)).toEqual({
        status: "not_found",
      });
      expect(
        await relabelAccount(
          { accountId, label: "shared" },
          { ...userB.session, householdId: userA.session.householdId },
          db,
        ),
      ).toEqual({ status: "not_found" });
      expect(await relabelAccount({ accountId, label: "shared" }, userA.session, db)).toEqual({
        status: "ok",
      });
      const [after] = await createHouseholdAccountsRepository(
        householdScope(userA.session),
        userA.scope,
      ).list(db);
      expect(after?.label).toBe("shared");
    });
  });
});
