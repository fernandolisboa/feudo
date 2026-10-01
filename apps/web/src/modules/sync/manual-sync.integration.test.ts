import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import type { HouseholdSession } from "@/modules/households";
import type { Database } from "@/platform/db/client";

import { encryptSecret } from "./crypto";
import { createDocumentHasher } from "./document-hash";
import { createFakeProvider } from "./provider/fake-provider";
import type { AuthenticateOutcome, DataProvider } from "./provider/provider";
import {
  createManualSyncQuotaRepository,
  createSyncUserRepository,
  pruneOldManualSyncTriggers,
} from "./repository";
import { bankConnection, manualSyncTrigger } from "./schema";
import { getManualSyncQuota, syncHouseholdNow, type SyncDeps } from "./service";
import { seedAccount, seedSyncedConnection } from "./test/seed-synced-connection";
import { joinHousehold, withTwoUsers, type SeededUser } from "./test/with-two-users";

const ENCRYPTION_KEY = "integration-test-encryption-key-with-32-chars";
const deps: SyncDeps = {
  provider: createFakeProvider(createDocumentHasher("integration-test-document-hash-key-32ch!")),
  encryptionKey: ENCRYPTION_KEY,
};
const SAO_PAULO = "America/Sao_Paulo";
// 12:00 in São Paulo.
const NOW = new Date("2026-10-01T15:00:00.000Z");
const SEEDED_AT = new Date("2026-09-20T09:00:00.000Z");

function ampleDeadline(): Date {
  return new Date(Date.now() + 5 * 60_000);
}

function runAt(now: Date) {
  return { now, deadline: ampleDeadline(), timeZone: SAO_PAULO };
}

function inHousehold(user: SeededUser, householdId: string): HouseholdSession {
  return { ...user.session, householdId };
}

async function saveCredentials(db: Database, user: SeededUser): Promise<void> {
  await createSyncUserRepository(user.scope).saveCredential(db, {
    provider: "pluggy",
    ciphertext: encryptSecret(
      JSON.stringify({ clientId: "id", clientSecret: "client-secret" }),
      ENCRYPTION_KEY,
    ),
    validatedAt: SEEDED_AT,
  });
}

async function seedConnection(
  db: Database,
  owner: SeededUser,
  householdId: string,
  itemId: string,
): Promise<string> {
  const { connectionId } = await seedSyncedConnection(db, owner, {
    household: { householdId },
    itemId,
    accounts: [seedAccount({ providerAccountId: `${itemId}-account`, providerItemId: itemId })],
    syncedAt: SEEDED_AT,
  });
  return connectionId;
}

async function connectionState(db: Database, connectionId: string) {
  const [row] = await db
    .select({
      lastSyncedAt: bankConnection.lastSyncedAt,
      lastSyncAttemptedAt: bankConnection.lastSyncAttemptedAt,
      lastSyncError: bankConnection.lastSyncError,
    })
    .from(bankConnection)
    .where(eq(bankConnection.id, connectionId));
  return row;
}

describe("syncHouseholdNow (integration)", () => {
  it("re-reads every connection with an account in the household, another member's included, under each owner's credentials", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA }) => {
      await joinHousehold(db, userB.id, householdA);
      await saveCredentials(db, userA);
      await saveCredentials(db, userB);
      const ownConnection = await seedConnection(db, userA, householdA, "item-a");
      const partnersConnection = await seedConnection(db, userB, householdA, "item-b-in-a");

      const outcome = await syncHouseholdNow(userA.session, db, deps, runAt(NOW));

      expect(outcome).toEqual({ status: "ok", limit: 3, used: 1, remaining: 2 });
      for (const connectionId of [ownConnection, partnersConnection]) {
        const state = await connectionState(db, connectionId);
        expect(state).toMatchObject({ lastSyncedAt: NOW, lastSyncError: null });
        expect(state?.lastSyncAttemptedAt).toBeInstanceOf(Date);
      }
    });
  });

  it("never reads a connection with no account in the session's household (isolation)", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      await saveCredentials(db, userA);
      await saveCredentials(db, userB);
      await seedConnection(db, userA, householdA, "item-a");
      const othersConnection = await seedConnection(db, userB, householdB, "item-b");

      await syncHouseholdNow(userA.session, db, deps, runAt(NOW));

      expect(await connectionState(db, othersConnection)).toEqual({
        lastSyncedAt: SEEDED_AT,
        lastSyncAttemptedAt: null,
        lastSyncError: null,
      });
      expect(await getManualSyncQuota({ householdId: householdB }, db, runAt(NOW))).toEqual({
        limit: 3,
        used: 0,
        remaining: 3,
      });
    });
  });

  it("refuses a fourth manual sync on the same household day, shared by every member, without reading anything", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA }) => {
      await joinHousehold(db, userB.id, householdA);
      await saveCredentials(db, userA);
      const connectionId = await seedConnection(db, userA, householdA, "item-a");

      const statuses = [];
      for (const session of [userA.session, inHousehold(userB, householdA), userA.session]) {
        statuses.push((await syncHouseholdNow(session, db, deps, runAt(NOW))).status);
      }
      const before = await connectionState(db, connectionId);
      const refused = await syncHouseholdNow(
        inHousehold(userB, householdA),
        db,
        deps,
        runAt(new Date(NOW.getTime() + 60_000)),
      );

      expect(statuses).toEqual(["ok", "ok", "ok"]);
      expect(refused).toEqual({ status: "quota_exhausted" });
      expect(await connectionState(db, connectionId)).toEqual(before);
      expect(await getManualSyncQuota({ householdId: householdA }, db, runAt(NOW))).toEqual({
        limit: 3,
        used: 3,
        remaining: 0,
      });
    });
  });

  it("does not let one household's spent quota touch another's", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      await saveCredentials(db, userA);
      await saveCredentials(db, userB);
      await seedConnection(db, userA, householdA, "item-a");
      await seedConnection(db, userB, householdB, "item-b");

      for (let attempt = 0; attempt < 3; attempt += 1) {
        await syncHouseholdNow(userA.session, db, deps, runAt(NOW));
      }

      expect((await syncHouseholdNow(userA.session, db, deps, runAt(NOW))).status).toBe(
        "quota_exhausted",
      );
      expect(await syncHouseholdNow(userB.session, db, deps, runAt(NOW))).toEqual({
        status: "ok",
        limit: 3,
        used: 1,
        remaining: 2,
      });
      expect(
        await createManualSyncQuotaRepository({ householdId: householdA }).countOn(
          db,
          "2026-10-01",
        ),
      ).toBe(3);
      expect(
        await createManualSyncQuotaRepository({ householdId: householdB }).countOn(
          db,
          "2026-10-01",
        ),
      ).toBe(1);
    });
  });

  it("resets the quota at the household's own midnight, not UTC's", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      await saveCredentials(db, userA);
      await seedConnection(db, userA, householdA, "item-a");
      // 23:30 on 1 October in São Paulo, already 2 October in UTC.
      const lateEvening = new Date("2026-10-02T02:30:00.000Z");
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await syncHouseholdNow(userA.session, db, deps, runAt(lateEvening));
      }

      const beforeMidnight = await syncHouseholdNow(
        userA.session,
        db,
        deps,
        runAt(new Date("2026-10-02T02:59:00.000Z")),
      );
      const afterMidnight = await syncHouseholdNow(
        userA.session,
        db,
        deps,
        runAt(new Date("2026-10-02T03:01:00.000Z")),
      );

      expect(beforeMidnight).toEqual({ status: "quota_exhausted" });
      expect(afterMidnight).toMatchObject({ status: "ok", used: 1, remaining: 2 });
    });
  });

  it("spends nothing when the household has no account to read", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      await saveCredentials(db, userB);
      await seedConnection(db, userB, householdB, "item-b");

      const outcome = await syncHouseholdNow(userA.session, db, deps, runAt(NOW));

      expect(outcome).toEqual({ status: "nothing_to_sync" });
      expect(await getManualSyncQuota({ householdId: householdA }, db, runAt(NOW))).toMatchObject({
        used: 0,
      });
    });
  });

  it("grants exactly the quota when members press the button at the same moment", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      await saveCredentials(db, userA);
      await seedConnection(db, userA, householdA, "item-a");

      const outcomes = await Promise.all(
        Array.from({ length: 5 }, () => syncHouseholdNow(userA.session, db, deps, runAt(NOW))),
      );

      const statuses = outcomes.map((outcome) => outcome.status).sort();
      expect(statuses).toEqual(["ok", "ok", "ok", "quota_exhausted", "quota_exhausted"]);
      const rows = await db
        .select({ id: manualSyncTrigger.id })
        .from(manualSyncTrigger)
        .where(eq(manualSyncTrigger.householdId, householdA));
      expect(rows).toHaveLength(3);
    });
  });

  it("reports a partial sync and records why a member's connection failed", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA }) => {
      await joinHousehold(db, userB.id, householdA);
      await saveCredentials(db, userA);
      const ownConnection = await seedConnection(db, userA, householdA, "item-a");
      const partnersConnection = await seedConnection(db, userB, householdA, "item-b-in-a");

      const outcome = await syncHouseholdNow(userA.session, db, deps, runAt(NOW));

      expect(outcome).toMatchObject({ status: "partial", remaining: 2 });
      expect(await connectionState(db, ownConnection)).toMatchObject({
        lastSyncedAt: NOW,
        lastSyncError: null,
      });
      expect(await connectionState(db, partnersConnection)).toMatchObject({
        lastSyncedAt: SEEDED_AT,
        lastSyncError: "no_credentials",
      });
    });
  });

  it("does not report success when the household's only connection was deleted mid-run", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      await saveCredentials(db, userA);
      const connectionId = await seedConnection(db, userA, householdA, "item-a");
      const deletingProvider: DataProvider = {
        name: "fake",
        async authenticate(credentials, options): Promise<AuthenticateOutcome> {
          await db.delete(bankConnection).where(eq(bankConnection.id, connectionId));
          return deps.provider.authenticate(credentials, options);
        },
      };

      const outcome = await syncHouseholdNow(
        userA.session,
        db,
        { ...deps, provider: deletingProvider },
        runAt(NOW),
      );

      expect(outcome).toMatchObject({ status: "failed" });
    });
  });
});

describe("pruneOldManualSyncTriggers (integration)", () => {
  it("deletes only triggers older than the cut-off", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      await db.insert(manualSyncTrigger).values([
        {
          householdId: householdA,
          triggeredByUserId: userA.id,
          localDay: "2026-09-28",
          triggeredAt: new Date("2026-09-28T12:00:00.000Z"),
        },
        {
          householdId: householdA,
          triggeredByUserId: userA.id,
          localDay: "2026-10-01",
          triggeredAt: NOW,
        },
      ]);

      const deleted = await pruneOldManualSyncTriggers(db, new Date("2026-09-30T00:00:00.000Z"));

      expect(deleted).toBe(1);
      const remaining = await db
        .select({ localDay: manualSyncTrigger.localDay })
        .from(manualSyncTrigger);
      expect(remaining).toEqual([{ localDay: "2026-10-01" }]);
    });
  });
});
