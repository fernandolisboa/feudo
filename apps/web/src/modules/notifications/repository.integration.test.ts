import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { user } from "@/modules/auth/schema";
import { withTwoUsers } from "@/modules/sync/test/with-two-users";

import { createPushSubscriptionRepository, MAX_DEVICES_PER_USER } from "./repository";
import { pushSubscription } from "./schema";
import { scopeForUser } from "./scope";
import { fakeSubscriptionInput } from "./test/fake-push-sender";

describe("push_subscription isolation (ADR-0001)", () => {
  it("a user lists, and removes, only their own devices", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const repositoryA = createPushSubscriptionRepository(scopeForUser(userA.id));
      const repositoryB = createPushSubscriptionRepository(scopeForUser(userB.id));
      const deviceA = fakeSubscriptionInput();
      const deviceB = fakeSubscriptionInput();
      await repositoryA.save(db, deviceA);
      await repositoryB.save(db, deviceB);

      expect((await repositoryA.list(db)).map((row) => row.endpoint)).toEqual([deviceA.endpoint]);
      expect((await repositoryB.list(db)).map((row) => row.endpoint)).toEqual([deviceB.endpoint]);

      expect(await repositoryB.remove(db, deviceA.endpoint)).toBe(false);
      await repositoryB.removeAll(db);
      expect((await repositoryA.list(db)).map((row) => row.endpoint)).toEqual([deviceA.endpoint]);
      expect(await repositoryB.list(db)).toEqual([]);

      expect(await repositoryA.remove(db, deviceA.endpoint)).toBe(true);
      expect(await repositoryA.list(db)).toEqual([]);
    });
  });

  it("a device belongs to whoever turned notifications on there last", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const repositoryA = createPushSubscriptionRepository(scopeForUser(userA.id));
      const repositoryB = createPushSubscriptionRepository(scopeForUser(userB.id));
      const sharedDevice = fakeSubscriptionInput();
      await repositoryA.save(db, sharedDevice);

      await repositoryB.save(db, {
        ...sharedDevice,
        keys: { p256dh: "C".repeat(87), auth: "D".repeat(22) },
      });

      expect(await repositoryA.list(db)).toEqual([]);
      const rows = await db
        .select()
        .from(pushSubscription)
        .where(eq(pushSubscription.endpoint, sharedDevice.endpoint));
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ userId: userB.id, p256dh: "C".repeat(87) });
    });
  });

  it("saving the same device again keeps one row", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const repository = createPushSubscriptionRepository(scopeForUser(userA.id));
      const device = fakeSubscriptionInput();
      await repository.save(db, device);
      await repository.save(db, device);
      expect(await repository.list(db)).toHaveLength(1);
    });
  });

  it(`keeps at most ${String(MAX_DEVICES_PER_USER)} devices per user, dropping the oldest, and never another user's`, async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const repositoryA = createPushSubscriptionRepository(scopeForUser(userA.id));
      const repositoryB = createPushSubscriptionRepository(scopeForUser(userB.id));
      const deviceB = fakeSubscriptionInput();
      await repositoryB.save(db, deviceB);
      const devicesA = Array.from({ length: MAX_DEVICES_PER_USER + 2 }, () =>
        fakeSubscriptionInput(),
      );
      for (const device of devicesA) {
        await repositoryA.save(db, device);
      }

      const kept = (await repositoryA.list(db)).map((row) => row.endpoint);
      expect(kept).toHaveLength(MAX_DEVICES_PER_USER);
      expect(kept).not.toContain(devicesA[0]?.endpoint);
      expect(kept).not.toContain(devicesA[1]?.endpoint);
      expect(kept).toContain(devicesA[MAX_DEVICES_PER_USER + 1]?.endpoint);
      expect((await repositoryB.list(db)).map((row) => row.endpoint)).toEqual([deviceB.endpoint]);
    });
  });

  it("goes with the user row", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await createPushSubscriptionRepository(scopeForUser(userA.id)).save(
        db,
        fakeSubscriptionInput(),
      );
      await db.delete(user).where(eq(user.id, userA.id));
      expect(await db.select().from(pushSubscription)).toEqual([]);
    });
  });
});
