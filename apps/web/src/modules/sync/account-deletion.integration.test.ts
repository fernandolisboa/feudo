import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { user } from "@/modules/auth/schema";

import {
  deleteConnectionsForAccountPurge,
  describeHouseholdDataLoss,
  destroyProviderCredentials,
} from "./account-deletion";
import { listConnectionsToSync, listHouseholdConnectionsToSync } from "./repository";
import { bankAccount, bankConnection, providerCredential } from "./schema";
import { seedSyncedConnection, seedTransaction } from "./test/seed-synced-connection";
import { joinHousehold, withTwoUsers } from "./test/with-two-users";

describe("sync side of account deletion (integration)", () => {
  it("never queues a connection whose owner asked to delete their account, daily or manual", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA }) => {
      await joinHousehold(db, userB.id, householdA);
      const connectionA = await seedSyncedConnection(db, userA, {
        household: { householdId: householdA },
        itemId: "item-a",
      });
      const connectionB = await seedSyncedConnection(db, userB, {
        household: { householdId: householdA },
        itemId: "item-b",
      });
      expect((await listConnectionsToSync(db)).map((row) => row.id).sort()).toEqual(
        [connectionA.connectionId, connectionB.connectionId].sort(),
      );

      await db.update(user).set({ deletionRequestedAt: new Date() }).where(eq(user.id, userA.id));

      expect((await listConnectionsToSync(db)).map((row) => row.id)).toEqual([
        connectionB.connectionId,
      ]);
      expect(
        (await listHouseholdConnectionsToSync(db, { householdId: householdA })).map(
          (row) => row.id,
        ),
      ).toEqual([connectionB.connectionId]);
    });
  });

  it("isolation: describes only the session user's own accounts and months, per household", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      await joinHousehold(db, userA.id, householdB);
      await seedSyncedConnection(db, userA, {
        household: { householdId: householdA },
        itemId: "item-a",
        transactions: [
          seedTransaction({ providerTransactionId: "t1", date: "2026-08-02" }),
          seedTransaction({ providerTransactionId: "t2", date: "2026-08-20" }),
          seedTransaction({ providerTransactionId: "t3", date: "2026-06-01" }),
        ],
      });
      await seedSyncedConnection(db, userB, {
        household: { householdId: householdB },
        itemId: "item-b",
        transactions: [seedTransaction({ providerTransactionId: "t4", date: "2026-01-01" })],
      });

      const lossA = await describeHouseholdDataLoss(db, userA.session);
      expect([...lossA.entries()]).toEqual([
        [householdA, { accounts: 1, months: ["2026-06", "2026-08"] }],
      ]);
      const lossB = await describeHouseholdDataLoss(db, userB.session);
      expect([...lossB.entries()]).toEqual([[householdB, { accounts: 1, months: ["2026-01"] }]]);
    });
  });

  it("isolation: destroys only the session user's credentials and purges only the given user's connections", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      for (const owner of [userA, userB]) {
        await db.insert(providerCredential).values({
          userId: owner.id,
          provider: "pluggy",
          ciphertext: "x",
          lastValidatedAt: new Date(),
        });
      }
      const connectionA = await seedSyncedConnection(db, userA, {
        household: { householdId: householdA },
        itemId: "item-a",
      });
      const connectionB = await seedSyncedConnection(db, userB, {
        household: { householdId: householdB },
        itemId: "item-b",
      });

      await destroyProviderCredentials(db, userA.session);
      await deleteConnectionsForAccountPurge(db, userA.id);

      expect((await db.select().from(providerCredential)).map((row) => row.userId)).toEqual([
        userB.id,
      ]);
      expect((await db.select().from(bankConnection)).map((row) => row.id)).toEqual([
        connectionB.connectionId,
      ]);
      expect(
        await db
          .select()
          .from(bankAccount)
          .where(eq(bankAccount.connectionId, connectionA.connectionId)),
      ).toEqual([]);
    });
  });
});
