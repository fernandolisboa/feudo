import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/auth")>()),
  getCurrentSession: getCurrentSessionMock,
}));

import { organization, user } from "@/modules/auth/schema";
import {
  joinHousehold,
  seedHousehold,
  seedUser,
  withTwoUsers,
} from "@/modules/sync/test/with-two-users";

import { handleForgetDeviceRequest } from "./forget-device-request";
import { createPushSubscriptionRepository } from "./repository";
import { pushSubscription } from "./schema";
import { scopeForUser } from "./scope";
import {
  createNotifier,
  getPushSubscriptionsForExport,
  removePushSubscription,
  removePushSubscriptionsForAccountDeletion,
  savePushSubscription,
} from "./service";
import { createFakeNotifier, fakeSubscriptionInput } from "./test/fake-push-sender";

const RESERVE_EVENT = { kind: "reserve_target_moved", closedMonth: "2026-09" } as const;

beforeEach(() => {
  getCurrentSessionMock.mockReset();
  vi.stubEnv("VAPID_PUBLIC_KEY", `B${"x".repeat(86)}`);
  vi.stubEnv("VAPID_PRIVATE_KEY", "y".repeat(43));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("notifyHousehold (integration)", () => {
  it("reaches every member of that household with a device, and nobody else", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA }) => {
      const carla = await seedUser(db, "Carla", await seedHousehold(db, "Household C"));
      await joinHousehold(db, carla.id, householdA);
      const deviceA = fakeSubscriptionInput();
      const deviceB = fakeSubscriptionInput();
      const deviceCarla = fakeSubscriptionInput("web.push.apple.com");
      await createPushSubscriptionRepository(userA.scope).save(db, deviceA);
      await createPushSubscriptionRepository(userB.scope).save(db, deviceB);
      await createPushSubscriptionRepository(carla.scope).save(db, deviceCarla);
      const { notifier, sender } = createFakeNotifier();

      const counts = await notifier.notifyHousehold(db, { householdId: householdA }, RESERVE_EVENT);

      expect(counts).toEqual({ delivered: 2, gone: 0, failed: 0 });
      expect(sender.sent.map((send) => send.endpoint).sort()).toEqual(
        [deviceA.endpoint, deviceCarla.endpoint].sort(),
      );
      expect(sender.sent[0]?.payload.url).toBe("/reserva");
      expect(sender.sent[0]?.payload.body).toContain("Household A:");
    });
  });

  it("skips a member whose account deletion is pending", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      await createPushSubscriptionRepository(userA.scope).save(db, fakeSubscriptionInput());
      await db.update(user).set({ deletionRequestedAt: new Date() }).where(eq(user.id, userA.id));
      const { notifier, sender } = createFakeNotifier();

      await notifier.notifyHousehold(db, { householdId: householdA }, RESERVE_EVENT);

      expect(sender.sent).toEqual([]);
    });
  });

  it("sends nothing for a household pending deletion", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      await createPushSubscriptionRepository(userA.scope).save(db, fakeSubscriptionInput());
      await db
        .update(organization)
        .set({ deletionRequestedAt: new Date() })
        .where(eq(organization.id, householdA));
      const { notifier, sender } = createFakeNotifier();

      await notifier.notifyHousehold(db, { householdId: householdA }, RESERVE_EVENT);

      expect(sender.sent).toEqual([]);
    });
  });

  it("forgets a device the push service says is gone, and only that one", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      const repository = createPushSubscriptionRepository(userA.scope);
      const gone = fakeSubscriptionInput();
      const alive = fakeSubscriptionInput();
      await repository.save(db, gone);
      await repository.save(db, alive);
      const { notifier, sender } = createFakeNotifier();
      sender.gone.add(gone.endpoint);

      const counts = await notifier.notifyHousehold(db, { householdId: householdA }, RESERVE_EVENT);

      expect(counts).toEqual({ delivered: 1, gone: 1, failed: 0 });
      expect((await repository.list(db)).map((row) => row.endpoint)).toEqual([alive.endpoint]);
    });
  });

  it("sends nothing at all when push is off", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      await createPushSubscriptionRepository(userA.scope).save(db, fakeSubscriptionInput());
      expect(
        await createNotifier(null).notifyHousehold(db, { householdId: householdA }, RESERVE_EVENT),
      ).toEqual({ delivered: 0, gone: 0, failed: 0 });
    });
  });
});

describe("notifyUser (integration)", () => {
  it("reaches only that person's devices", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const deviceA = fakeSubscriptionInput();
      await createPushSubscriptionRepository(userA.scope).save(db, deviceA);
      await createPushSubscriptionRepository(userB.scope).save(db, fakeSubscriptionInput());
      const { notifier, sender } = createFakeNotifier();

      await notifier.notifyUser(
        db,
        { userId: userA.id },
        { kind: "sync_failing", connectionId: "c1", institutionName: "Nubank" },
      );

      expect(sender.sent.map((send) => send.endpoint)).toEqual([deviceA.endpoint]);
    });
  });

  it("never throws, even when the send itself blows up", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      vi.spyOn(console, "warn").mockImplementation(() => undefined);
      await createPushSubscriptionRepository(userA.scope).save(db, fakeSubscriptionInput());
      const notifier = createNotifier({
        send: () => Promise.reject(new Error("boom")),
      });

      await expect(
        notifier.notifyUser(
          db,
          { userId: userA.id },
          { kind: "sync_failing", connectionId: "c1", institutionName: "Nubank" },
        ),
      ).resolves.toEqual({ delivered: 0, gone: 0, failed: 0 });
    });
  });
});

describe("turning notifications on and off (integration)", () => {
  it("saves and removes only the signed-in person's device", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const deviceB = fakeSubscriptionInput();
      await createPushSubscriptionRepository(userB.scope).save(db, deviceB);
      getCurrentSessionMock.mockResolvedValue(userA.session);
      const deviceA = fakeSubscriptionInput();

      expect(await savePushSubscription(deviceA)).toEqual({ status: "ok" });
      expect(await removePushSubscription(deviceB.endpoint)).toEqual({ status: "ok" });

      const rows = await db.select().from(pushSubscription);
      expect(rows.map((row) => [row.userId, row.endpoint]).sort()).toEqual(
        [
          [userA.id, deviceA.endpoint],
          [userB.id, deviceB.endpoint],
        ].sort(),
      );

      expect(await removePushSubscription(deviceA.endpoint)).toEqual({ status: "ok" });
      expect(await createPushSubscriptionRepository(scopeForUser(userA.id)).list(db)).toEqual([]);
    });
  });

  it("refuses without a session, with an endpoint outside the push services, or with push off", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      getCurrentSessionMock.mockResolvedValue(null);
      expect(await savePushSubscription(fakeSubscriptionInput())).toEqual({
        status: "unauthenticated",
      });

      getCurrentSessionMock.mockResolvedValue(userA.session);
      expect(
        await savePushSubscription({ ...fakeSubscriptionInput(), endpoint: "https://evil.test/x" }),
      ).toEqual({ status: "invalid" });

      vi.stubEnv("VAPID_PUBLIC_KEY", "");
      vi.stubEnv("VAPID_PRIVATE_KEY", "");
      expect(await savePushSubscription(fakeSubscriptionInput())).toEqual({ status: "disabled" });

      expect(await db.select().from(pushSubscription)).toEqual([]);
    });
  });

  it("asking to delete the account removes every device of that person only", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await createPushSubscriptionRepository(userA.scope).save(db, fakeSubscriptionInput());
      await createPushSubscriptionRepository(userA.scope).save(db, fakeSubscriptionInput());
      await createPushSubscriptionRepository(userB.scope).save(db, fakeSubscriptionInput());

      await removePushSubscriptionsForAccountDeletion(db, userA.session);

      const rows = await db.select().from(pushSubscription);
      expect(rows.map((row) => row.userId)).toEqual([userB.id]);
    });
  });

  it("exports the push service and date of each device, never the address", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const device = fakeSubscriptionInput();
      await createPushSubscriptionRepository(userA.scope).save(db, device);

      const exported = await getPushSubscriptionsForExport(userA.session, db);

      expect(exported.map((row) => row.pushService)).toEqual(["fcm.googleapis.com"]);
      expect(exported[0]?.createdAt).toBeInstanceOf(Date);
      expect(JSON.stringify(exported)).not.toContain(device.endpoint);
    });
  });
});

function forgetRequest(body: unknown, site = "same-origin"): Request {
  return new Request("https://feudo.test/api/push-subscription", {
    method: "DELETE",
    headers: { "content-type": "application/json", "sec-fetch-site": site },
    body: JSON.stringify(body),
  });
}

describe("forgetting a device at sign-out (integration)", () => {
  it("removes only the signed-in person's row for that endpoint, so no later send reaches it", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA }) => {
      const deviceA = fakeSubscriptionInput();
      const deviceB = fakeSubscriptionInput();
      await createPushSubscriptionRepository(userA.scope).save(db, deviceA);
      await createPushSubscriptionRepository(userB.scope).save(db, deviceB);
      getCurrentSessionMock.mockResolvedValue(userA.session);

      expect(
        (await handleForgetDeviceRequest(forgetRequest({ endpoint: deviceB.endpoint }))).status,
      ).toBe(204);
      expect(
        (await handleForgetDeviceRequest(forgetRequest({ endpoint: deviceA.endpoint }))).status,
      ).toBe(204);

      const rows = await db.select().from(pushSubscription);
      expect(rows.map((row) => row.endpoint)).toEqual([deviceB.endpoint]);
      const { notifier, sender } = createFakeNotifier();
      await notifier.notifyHousehold(db, { householdId: householdA }, RESERVE_EVENT);
      expect(sender.sent).toEqual([]);
    });
  });

  it("refuses another site, a malformed body and a missing session, changing nothing", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const device = fakeSubscriptionInput();
      await createPushSubscriptionRepository(userA.scope).save(db, device);
      getCurrentSessionMock.mockResolvedValue(userA.session);

      expect(
        (
          await handleForgetDeviceRequest(
            forgetRequest({ endpoint: device.endpoint }, "cross-site"),
          )
        ).status,
      ).toBe(403);
      expect(
        (await handleForgetDeviceRequest(forgetRequest({ endpoint: "https://evil.test/x" })))
          .status,
      ).toBe(400);
      expect((await handleForgetDeviceRequest(forgetRequest("texto"))).status).toBe(400);

      getCurrentSessionMock.mockResolvedValue(null);
      expect(
        (await handleForgetDeviceRequest(forgetRequest({ endpoint: device.endpoint }))).status,
      ).toBe(401);

      expect(await db.select().from(pushSubscription)).toHaveLength(1);
    });
  });
});
