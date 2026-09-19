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
import { bankConnectionConsent, providerCredential } from "./schema";
import {
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

      const accounts = await createHouseholdAccountsRepository(householdScope(userA.session)).list(
        db,
      );
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

  it("destroys the credentials but keeps connections and accounts until deleted", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await connectBanco(db, userA);
      const repository = createSyncUserRepository(userA.scope);

      expect(await removeCredentials(userA.session, db)).toEqual({ status: "ok" });
      expect(await removeCredentials(userA.session, db)).toEqual({ status: "not_found" });
      expect(await repository.getCredential(db)).toBeUndefined();
      expect(
        await createHouseholdAccountsRepository(householdScope(userA.session)).list(db),
      ).toHaveLength(6);

      const [connection] = await repository.listConnections(db);
      expect(await deleteConnection(connection?.id ?? "", userA.session, db)).toEqual({
        status: "ok",
      });
      expect(
        await createHouseholdAccountsRepository(householdScope(userA.session)).list(db),
      ).toEqual([]);
      expect(await deleteConnection(connection?.id ?? "", userA.session, db)).toEqual({
        status: "not_found",
      });
    });
  });

  it("lets only the connection owner relabel, inside their household", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await connectBanco(db, userA);
      const [account] = await createHouseholdAccountsRepository(householdScope(userA.session)).list(
        db,
      );
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
      const [after] = await createHouseholdAccountsRepository(householdScope(userA.session)).list(
        db,
      );
      expect(after?.label).toBe("shared");
    });
  });
});
