import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { bankConnectionConsent } from "./schema";
import {
  ConnectionNotOwnedError,
  createHouseholdAccountsRepository,
  createSyncUserRepository,
  pruneOrphanConsents,
} from "./repository";
import { householdScope } from "@/modules/households";
import { withTwoUsers, type TwoUsers } from "./test/with-two-users";

import type { NormalizedAccount } from "./provider/provider";
import type { Database } from "@/platform/db/client";

const ITEM_ID = "0f1e2d3c-4b5a-4a6b-8c7d-8e9f0a1b2c3d";

function account(overrides: Partial<NormalizedAccount> = {}): NormalizedAccount {
  return {
    providerAccountId: "acc-1",
    providerItemId: ITEM_ID,
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

async function connectFor(
  db: Database,
  owner: TwoUsers["userA"],
  householdId: string,
  itemId = ITEM_ID,
): Promise<string> {
  const repository = createSyncUserRepository(owner.scope);
  const consentId = await repository.createConsent(db, { scopeVersion: "v", scopeText: "text" });
  const connectionId = await repository.createConnection(db, {
    provider: "pluggy",
    providerItemId: itemId,
    institutionName: "Banco Fixture",
    institutionProviderId: "601",
    consentId,
  });
  await repository.upsertAccounts(db, connectionId, [account()], {
    householdIdForNew: householdId,
    syncedAt: new Date(),
  });
  return connectionId;
}

describe("sync user-scoped repository isolation (integration)", () => {
  it("reads and deletes only the scoped user's own credential", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const repositoryA = createSyncUserRepository(userA.scope);
      const repositoryB = createSyncUserRepository(userB.scope);
      await repositoryA.saveCredential(db, {
        provider: "pluggy",
        ciphertext: "enc:a",
        validatedAt: new Date(),
      });

      expect((await repositoryA.getCredential(db))?.ciphertext).toBe("enc:a");
      expect(await repositoryB.getCredential(db)).toBeUndefined();
      expect(await repositoryB.deleteCredential(db)).toBe(false);
      expect((await repositoryA.getCredential(db))?.ciphertext).toBe("enc:a");
    });
  });

  it("does not let another user read, reuse or delete a consent or connection", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA }) => {
      const repositoryA = createSyncUserRepository(userA.scope);
      const repositoryB = createSyncUserRepository(userB.scope);
      const connectionId = await connectFor(db, userA, householdA);
      const [connectionA] = await repositoryA.listConnections(db);

      expect(await repositoryB.listConnections(db)).toEqual([]);
      expect(await repositoryB.findConnection(db, connectionId)).toBeUndefined();
      expect(await repositoryB.findConnectionByItem(db, "pluggy", ITEM_ID)).toBeUndefined();
      expect(await repositoryB.findConsent(db, connectionA?.id ?? "")).toBeUndefined();
      await expect(
        repositoryB.createConnection(db, {
          provider: "pluggy",
          providerItemId: "another",
          institutionName: "x",
          institutionProviderId: "1",
          consentId: (await repositoryA.findConnection(db, connectionId))?.consentId ?? "",
        }),
      ).rejects.toThrow();
      await expect(
        repositoryB.markSynced(db, connectionId, { syncedAt: new Date(), error: null }),
      ).rejects.toThrow(ConnectionNotOwnedError);
      await expect(
        repositoryB.upsertAccounts(db, connectionId, [account()], {
          householdIdForNew: null,
          syncedAt: new Date(),
        }),
      ).rejects.toThrow(ConnectionNotOwnedError);
      expect(await repositoryB.deleteConnection(db, connectionId)).toBe(false);
      expect(await repositoryA.listConnections(db)).toHaveLength(1);
    });
  });

  it("deletes the consent together with the last connection that referenced it", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      const repository = createSyncUserRepository(userA.scope);
      const connectionId = await connectFor(db, userA, householdA);
      const consentId = (await repository.findConnection(db, connectionId))?.consentId ?? "";

      expect(await repository.deleteConnection(db, connectionId)).toBe(true);

      expect(await repository.findConsent(db, consentId)).toBeUndefined();
      expect(
        await createHouseholdAccountsRepository(householdScope(userA.session)).list(db),
      ).toEqual([]);
    });
  });

  it("keeps the household and label of an account seen before on re-sync", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      const repository = createSyncUserRepository(userA.scope);
      const accounts = createHouseholdAccountsRepository(householdScope(userA.session));
      const connectionId = await connectFor(db, userA, householdA);
      const [first] = await accounts.list(db);
      await accounts.relabel(db, {
        accountId: first?.id ?? "",
        label: "shared",
        ownerUserId: userA.id,
      });

      await repository.upsertAccounts(db, connectionId, [account({ balanceCentavos: 1 })], {
        householdIdForNew: null,
        syncedAt: new Date(),
      });

      const [after] = await accounts.list(db);
      expect(after).toMatchObject({ id: first?.id, label: "shared", balanceCentavos: 1 });
    });
  });
});

describe("household accounts repository isolation (integration)", () => {
  it("lists only the scoped household's accounts", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      await connectFor(db, userA, householdA);
      await connectFor(db, userB, householdB);

      const listA = await createHouseholdAccountsRepository(householdScope(userA.session)).list(db);
      const listB = await createHouseholdAccountsRepository(householdScope(userB.session)).list(db);

      expect(listA.map((row) => row.connectedByUserId)).toEqual([userA.id]);
      expect(listB.map((row) => row.connectedByUserId)).toEqual([userB.id]);
    });
  });

  it("relabels only when the account is in the scoped household and the caller owns its connection", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA }) => {
      await connectFor(db, userA, householdA);
      const accountsA = createHouseholdAccountsRepository(householdScope(userA.session));
      const accountsB = createHouseholdAccountsRepository(householdScope(userB.session));
      const [row] = await accountsA.list(db);
      const accountId = row?.id ?? "";

      expect(
        await accountsB.relabel(db, { accountId, label: "shared", ownerUserId: userA.id }),
      ).toBe(false);
      expect(
        await accountsA.relabel(db, { accountId, label: "shared", ownerUserId: userB.id }),
      ).toBe(false);
      expect(
        await accountsA.relabel(db, { accountId, label: "shared", ownerUserId: userA.id }),
      ).toBe(true);
      expect((await accountsA.list(db))[0]?.label).toBe("shared");
    });
  });
});

describe("pruneOrphanConsents (integration)", () => {
  it("removes old consents that back no connection and keeps the rest", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      const repository = createSyncUserRepository(userA.scope);
      const connectionId = await connectFor(db, userA, householdA);
      const backing = (await repository.findConnection(db, connectionId))?.consentId ?? "";
      const oldOrphan = await repository.createConsent(db, { scopeVersion: "v", scopeText: "t" });
      const freshOrphan = await repository.createConsent(db, { scopeVersion: "v", scopeText: "t" });
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      await db
        .update(bankConnectionConsent)
        .set({ acceptedAt: twoDaysAgo })
        .where(eq(bankConnectionConsent.id, oldOrphan));
      await db
        .update(bankConnectionConsent)
        .set({ acceptedAt: twoDaysAgo })
        .where(eq(bankConnectionConsent.id, backing));

      const deleted = await pruneOrphanConsents(db, new Date(Date.now() - 24 * 60 * 60 * 1000));

      expect(deleted).toBe(1);
      expect(await repository.findConsent(db, oldOrphan)).toBeUndefined();
      expect(await repository.findConsent(db, freshOrphan)).toBeDefined();
      expect(await repository.findConsent(db, backing)).toBeDefined();
    });
  });
});
