import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";

import { bankAccount, bankConnection, bankConnectionConsent } from "./schema";
import {
  ConnectionNotOwnedError,
  createHouseholdAccountsRepository,
  createSyncUserRepository,
  pruneOldAuthAttempts,
  pruneOrphanConsents,
} from "./repository";
import { member } from "@/modules/auth/schema";
import { householdScope, type HouseholdScope } from "@/modules/households";
import { moveSeededAccount } from "./test/seed-synced-connection";
import { joinHousehold, withTwoUsers, type TwoUsers } from "./test/with-two-users";

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
  options: { itemId?: string; household?: HouseholdScope; accounts?: NormalizedAccount[] } = {},
): Promise<string> {
  const repository = createSyncUserRepository(owner.scope);
  const consentId = await repository.createConsent(db, { scopeVersion: "v", scopeText: "text" });
  const connectionId = await repository.createConnection(db, {
    provider: "pluggy",
    providerItemId: options.itemId ?? ITEM_ID,
    institutionName: "Banco Fixture",
    institutionProviderId: "601",
    consentId,
    defaultHousehold: options.household ?? householdScope(owner.session),
  });
  await repository.upsertAccounts(db, connectionId, options.accounts ?? [account()], {
    syncedAt: new Date(),
  });
  return connectionId;
}

function householdAccounts(household: string, viewer: TwoUsers["userA"]) {
  return createHouseholdAccountsRepository({ householdId: household }, viewer.scope);
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
    await withTwoUsers(async ({ db, userA, userB }) => {
      const repositoryA = createSyncUserRepository(userA.scope);
      const repositoryB = createSyncUserRepository(userB.scope);
      const connectionId = await connectFor(db, userA);
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
          defaultHousehold: householdScope(userB.session),
        }),
      ).rejects.toThrow();
      await expect(
        repositoryB.markSynced(db, connectionId, { syncedAt: new Date(), error: null }),
      ).rejects.toThrow(ConnectionNotOwnedError);
      await expect(
        repositoryB.upsertAccounts(db, connectionId, [account()], { syncedAt: new Date() }),
      ).rejects.toThrow(ConnectionNotOwnedError);
      await expect(
        repositoryB.upsertTransactions(db, connectionId, [], { syncedAt: new Date() }),
      ).rejects.toThrow(ConnectionNotOwnedError);
      await expect(repositoryB.recordSyncFailure(db, connectionId, "failed")).rejects.toThrow(
        ConnectionNotOwnedError,
      );
      await expect(repositoryB.recordSyncAttempt(db, connectionId, new Date())).rejects.toThrow(
        ConnectionNotOwnedError,
      );
      await expect(repositoryB.narrowFirstSync(db, connectionId, "2026-08-01")).rejects.toThrow(
        ConnectionNotOwnedError,
      );
      const [rowAfterRejectedWrites] = await db
        .select({
          lastSyncAttemptedAt: bankConnection.lastSyncAttemptedAt,
          firstSyncSince: bankConnection.firstSyncSince,
        })
        .from(bankConnection)
        .where(eq(bankConnection.id, connectionId));
      expect(rowAfterRejectedWrites).toEqual({ lastSyncAttemptedAt: null, firstSyncSince: null });
      expect(await repositoryB.listOwnedAccounts(db)).toEqual([]);
      const [accountOfA] = await repositoryA.listOwnedAccounts(db);
      expect(
        await moveSeededAccount(db, userB, accountOfA?.id ?? "", userB.session.householdId),
      ).toBe("not_found");
      await expect(repositoryB.hasTransactions(db, connectionId)).rejects.toThrow(
        ConnectionNotOwnedError,
      );
      expect(await repositoryB.deleteConnection(db, connectionId)).toBe(false);
      expect(await repositoryA.listConnections(db)).toHaveLength(1);
    });
  });

  it("deletes the consent together with the last connection that referenced it", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const repository = createSyncUserRepository(userA.scope);
      const connectionId = await connectFor(db, userA);
      const consentId = (await repository.findConnection(db, connectionId))?.consentId ?? "";

      expect(await repository.deleteConnection(db, connectionId)).toBe(true);

      expect(await repository.findConsent(db, consentId)).toBeUndefined();
      expect(
        await createHouseholdAccountsRepository(householdScope(userA.session), userA.scope).list(
          db,
        ),
      ).toEqual([]);
    });
  });

  it("keeps the household and label of an account seen before on re-sync", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const repository = createSyncUserRepository(userA.scope);
      const accounts = createHouseholdAccountsRepository(
        householdScope(userA.session),
        userA.scope,
      );
      const connectionId = await connectFor(db, userA);
      const [first] = await accounts.list(db);
      await accounts.relabel(db, { accountId: first?.id ?? "", label: "shared" });

      await repository.upsertAccounts(db, connectionId, [account({ balanceCentavos: 1 })], {
        syncedAt: new Date(),
      });

      const [after] = await accounts.list(db);
      expect(after).toMatchObject({ id: first?.id, label: "shared", balanceCentavos: 1 });
    });
  });
});

describe("renameConnection (integration)", () => {
  it("renames the scoped user's own connection", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const repository = createSyncUserRepository(userA.scope);
      const connectionId = await connectFor(db, userA);

      expect(await repository.renameConnection(db, connectionId, "Itaú")).toBe(true);

      const [connection] = await repository.listConnections(db);
      expect(connection?.institutionName).toBe("Itaú");
    });
  });

  it("does not let another user rename a connection that is not theirs", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const repositoryA = createSyncUserRepository(userA.scope);
      const repositoryB = createSyncUserRepository(userB.scope);
      const connectionId = await connectFor(db, userA);

      expect(await repositoryB.renameConnection(db, connectionId, "Nubank")).toBe(false);

      const [connection] = await repositoryA.listConnections(db);
      expect(connection?.institutionName).toBe("Banco Fixture");
    });
  });
});

describe("household accounts repository isolation (integration)", () => {
  it("lists only the scoped household's accounts", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await connectFor(db, userA);
      await connectFor(db, userB);

      const listA = await createHouseholdAccountsRepository(
        householdScope(userA.session),
        userA.scope,
      ).list(db);
      const listB = await createHouseholdAccountsRepository(
        householdScope(userB.session),
        userB.scope,
      ).list(db);

      expect(listA.map((row) => row.connectedByUserId)).toEqual([userA.id]);
      expect(listB.map((row) => row.connectedByUserId)).toEqual([userB.id]);
    });
  });

  it("relabels only when the account is in the scoped household and the caller owns its connection", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await connectFor(db, userA);
      const accountsA = createHouseholdAccountsRepository(
        householdScope(userA.session),
        userA.scope,
      );
      const otherHousehold = createHouseholdAccountsRepository(
        householdScope(userB.session),
        userA.scope,
      );
      const otherOwner = createHouseholdAccountsRepository(
        householdScope(userA.session),
        userB.scope,
      );
      const [row] = await accountsA.list(db);
      const accountId = row?.id ?? "";

      expect(await otherHousehold.relabel(db, { accountId, label: "shared" })).toBe(false);
      expect(await otherOwner.relabel(db, { accountId, label: "shared" })).toBe(false);
      expect(await accountsA.relabel(db, { accountId, label: "shared" })).toBe(true);
      expect((await accountsA.list(db))[0]?.label).toBe("shared");
    });
  });
});

describe("provider auth attempts (integration)", () => {
  it("counts only the scoped user's attempts and prunes old ones", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const repositoryA = createSyncUserRepository(userA.scope);
      const repositoryB = createSyncUserRepository(userB.scope);
      await repositoryA.recordAuthAttempt(db);
      await repositoryA.recordAuthAttempt(db);
      const since = new Date(Date.now() - 60 * 1000);

      expect(await repositoryA.countAuthAttemptsSince(db, since)).toBe(2);
      expect(await repositoryB.countAuthAttemptsSince(db, since)).toBe(0);

      expect(await pruneOldAuthAttempts(db, since)).toBe(0);
      expect(await pruneOldAuthAttempts(db, new Date(Date.now() + 1000))).toBe(2);
      expect(await repositoryA.countAuthAttemptsSince(db, since)).toBe(0);
    });
  });
});

describe("pruneOrphanConsents (integration)", () => {
  it("removes old consents that back no connection and keeps the rest", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const repository = createSyncUserRepository(userA.scope);
      const connectionId = await connectFor(db, userA);
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

describe("a member leaving a household (integration, #74)", () => {
  it("unassigns the leaver's accounts there, keeps them elsewhere, and assigns nothing new", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      const repositoryB = createSyncUserRepository(userB.scope);
      const membershipInA = await joinHousehold(db, userB.id, householdA);
      const intoA = await connectFor(db, userB, { household: { householdId: householdA } });
      await connectFor(db, userB, { itemId: "item-in-b", household: { householdId: householdB } });
      expect(await householdAccounts(householdA, userA).list(db)).toHaveLength(1);

      await db.delete(member).where(eq(member.id, membershipInA));

      expect(await householdAccounts(householdA, userA).list(db)).toEqual([]);
      expect(await householdAccounts(householdB, userB).list(db)).toHaveLength(1);
      await repositoryB.upsertAccounts(
        db,
        intoA,
        [account(), account({ providerAccountId: "acc-new", name: "Nova" })],
        { syncedAt: new Date() },
      );
      expect(await householdAccounts(householdA, userA).list(db)).toEqual([]);
      const owned = await repositoryB.listOwnedAccounts(db);
      expect(
        owned.filter((row) => row.connectionId === intoA).map((row) => [row.name, row.householdId]),
      ).toEqual([
        ["Conta corrente", null],
        ["Nova", null],
      ]);
      const [connection] = await db
        .select({ defaultHouseholdId: bankConnection.defaultHouseholdId })
        .from(bankConnection)
        .where(eq(bankConnection.id, intoA));
      expect(connection?.defaultHouseholdId).toBeNull();
    });
  });

  it("leaves the other members' accounts in the household", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA }) => {
      const membershipInA = await joinHousehold(db, userB.id, householdA);
      await connectFor(db, userA);
      await connectFor(db, userB, { household: { householdId: householdA } });

      await db.delete(member).where(eq(member.id, membershipInA));

      const remaining = await householdAccounts(householdA, userA).list(db);
      expect(remaining.map((row) => row.connectedByUserId)).toEqual([userA.id]);
    });
  });
});

describe("the household new accounts land in (integration, #76)", () => {
  it("assigns accounts listed after a connection started empty to the household chosen at connect time", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const repository = createSyncUserRepository(userA.scope);
      const connectionId = await connectFor(db, userA, { accounts: [] });
      expect(await repository.listOwnedAccounts(db)).toEqual([]);

      await repository.upsertAccounts(db, connectionId, [account()], { syncedAt: new Date() });

      const [row] = await repository.listOwnedAccounts(db);
      expect(row).toMatchObject({
        householdId: userA.session.householdId,
        householdName: "Household A",
      });
    });
  });
});

describe("the household a connection starts in (integration)", () => {
  it("records no default household when the owner is not a member of the session's household", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await db.delete(member).where(eq(member.userId, userA.id));

      const connectionId = await connectFor(db, userA);

      const [connection] = await db
        .select({ defaultHouseholdId: bankConnection.defaultHouseholdId })
        .from(bankConnection)
        .where(eq(bankConnection.id, connectionId));
      expect(connection?.defaultHouseholdId).toBeNull();
      const [row] = await createSyncUserRepository(userA.scope).listOwnedAccounts(db);
      expect(row?.householdId).toBeNull();
    });
  });
});

describe("moveAccount (integration, #13)", () => {
  it("moves an owned account to another household of the owner, and later accounts follow it", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      const repositoryB = createSyncUserRepository(userB.scope);
      await joinHousehold(db, userB.id, householdA);
      const connectionId = await connectFor(db, userB, { household: { householdId: householdA } });
      const [owned] = await repositoryB.listOwnedAccounts(db);

      expect(await moveSeededAccount(db, userB, owned?.id ?? "", householdB)).toBe("ok");

      expect(await householdAccounts(householdA, userA).list(db)).toEqual([]);
      expect((await householdAccounts(householdB, userB).list(db)).map((row) => row.id)).toEqual([
        owned?.id,
      ]);
      await repositoryB.upsertAccounts(
        db,
        connectionId,
        [account({ providerAccountId: "acc-later", name: "Depois" })],
        { syncedAt: new Date() },
      );
      const [later] = await db
        .select({ householdId: bankAccount.householdId })
        .from(bankAccount)
        .where(
          and(
            eq(bankAccount.connectionId, connectionId),
            eq(bankAccount.providerAccountId, "acc-later"),
          ),
        );
      expect(later?.householdId).toBe(householdB);
    });
  });

  it("brings an unassigned account back into a household of its owner", async () => {
    await withTwoUsers(async ({ db, userB, householdA, householdB }) => {
      const repositoryB = createSyncUserRepository(userB.scope);
      const membershipInA = await joinHousehold(db, userB.id, householdA);
      await connectFor(db, userB, { household: { householdId: householdA } });
      await db.delete(member).where(eq(member.id, membershipInA));
      const [unassigned] = await repositoryB.listOwnedAccounts(db);
      expect(unassigned?.householdId).toBeNull();

      expect(await moveSeededAccount(db, userB, unassigned?.id ?? "", householdB)).toBe("ok");

      expect(await householdAccounts(householdB, userB).list(db)).toHaveLength(1);
    });
  });

  it("refuses a household the owner does not belong to, and an account someone else owns", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      const repositoryB = createSyncUserRepository(userB.scope);
      await joinHousehold(db, userA.id, householdB);
      await connectFor(db, userB);
      const [ofB] = await repositoryB.listOwnedAccounts(db);
      const accountId = ofB?.id ?? "";

      expect(await moveSeededAccount(db, userB, accountId, householdA)).toBe("not_member");
      expect(await moveSeededAccount(db, userA, accountId, householdB)).toBe("not_found");
      expect(await moveSeededAccount(db, userA, accountId, householdA)).toBe("not_found");
      expect((await repositoryB.listOwnedAccounts(db))[0]?.householdId).toBe(householdB);
    });
  });
});
