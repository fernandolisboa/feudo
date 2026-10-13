import type { CurrentSession } from "@/modules/auth";
import { getCurrentSession } from "@/modules/auth";
import type { HouseholdScope } from "@/modules/households";

import { errorName } from "@/lib/error-name";
import type { SimpleOutcome } from "@/lib/outcome";
import type { PushPayload } from "@/lib/push-payload";
import { getDb, type Database, type DatabaseOrTransaction } from "@/platform/db/client";

import { readVapidKeys, type PushEnv } from "./env";
import {
  householdEventPayload,
  testPayload,
  userEventPayload,
  type HouseholdEvent,
  type UserEvent,
} from "./messages";
import {
  createPushSubscriptionRepository,
  deleteGoneSubscription,
  listHouseholdRecipients,
  listUserRecipients,
  type StoredPushSubscription,
} from "./repository";
import { pushUserScope } from "./scope";
import type { PushSender } from "./sender";
import {
  pushEndpointSchema,
  pushServiceHost,
  pushSubscriptionInputSchema,
  refusedPushServiceForLog,
} from "./validation";
import { createWebPushSender } from "./web-push-sender";

export type DeliveryCounts = { delivered: number; gone: number; failed: number };

const NOTHING_SENT: DeliveryCounts = { delivered: 0, gone: 0, failed: 0 };

// What the jobs call when an event happens (ADR-0012). Best effort by
// contract: it never throws, so a notification can never fail the job that
// detected the event.
export type Notifier = {
  notifyHousehold(
    db: Database,
    scope: HouseholdScope,
    event: HouseholdEvent,
  ): Promise<DeliveryCounts>;
  notifyUser(db: Database, owner: { userId: string }, event: UserEvent): Promise<DeliveryCounts>;
};

async function deliver(
  db: Database,
  sender: PushSender,
  subscriptions: StoredPushSubscription[],
  payload: PushPayload,
): Promise<DeliveryCounts> {
  const outcomes = await Promise.all(
    subscriptions.map(async (subscription) => {
      const delivery = await sender.send(subscription, payload);
      if (delivery === "gone") {
        await deleteGoneSubscription(db, subscription);
      }
      return delivery;
    }),
  );
  return {
    delivered: outcomes.filter((outcome) => outcome === "delivered").length,
    gone: outcomes.filter((outcome) => outcome === "gone").length,
    failed: outcomes.filter((outcome) => outcome === "failed").length,
  };
}

export function createNotifier(sender: PushSender | null): Notifier {
  return {
    async notifyHousehold(db, scope, event) {
      if (sender === null) {
        return NOTHING_SENT;
      }
      try {
        const recipients = await listHouseholdRecipients(db, scope);
        if (recipients === null) {
          return NOTHING_SENT;
        }
        const payload = householdEventPayload(event, scope.householdId, recipients.householdName);
        return await deliver(db, sender, recipients.subscriptions, payload);
      } catch (error) {
        console.warn(
          `notifications: ${event.kind} for household ${scope.householdId} failed (${errorName(error)})`,
        );
        return NOTHING_SENT;
      }
    },

    async notifyUser(db, owner, event) {
      if (sender === null) {
        return NOTHING_SENT;
      }
      try {
        const subscriptions = await listUserRecipients(db, owner.userId);
        return await deliver(db, sender, subscriptions, userEventPayload(event));
      } catch (error) {
        console.warn(`notifications: ${event.kind} for a user failed (${errorName(error)})`);
        return NOTHING_SENT;
      }
    },
  };
}

function readVapidKeysOrNull(env: PushEnv): ReturnType<typeof readVapidKeys> {
  try {
    return readVapidKeys(env);
  } catch (error) {
    console.warn(`notifications: push is off (${errorName(error)})`);
    return null;
  }
}

function senderFromEnv(env: PushEnv = process.env): PushSender | null {
  const keys = readVapidKeysOrNull(env);
  return keys === null ? null : createWebPushSender(keys);
}

export function createNotifierFromEnv(env: PushEnv = process.env): Notifier {
  return createNotifier(senderFromEnv(env));
}

// The key the browser subscribes with, or null when push is off and the
// Preferências section stays hidden.
export function readPushPublicKey(env: PushEnv = process.env): string | null {
  return readVapidKeysOrNull(env)?.publicKey ?? null;
}

export type SubscriptionWriteOutcome = SimpleOutcome<
  "ok" | "unauthenticated" | "invalid" | "disabled" | "failed"
>;

// A failed query's message carries its parameters, the endpoint among them,
// and the endpoint never goes to the logs (ADR-0008): only the error's name.
function logWriteFailure(action: "saving" | "removing", error: unknown): void {
  console.warn(`notifications: ${action} a device failed (${errorName(error)})`);
}

export async function savePushSubscription(input: unknown): Promise<SubscriptionWriteOutcome> {
  const session = await getCurrentSession();
  if (!session) {
    return { status: "unauthenticated" };
  }
  if (readPushPublicKey() === null) {
    return { status: "disabled" };
  }
  const parsed = pushSubscriptionInputSchema.safeParse(input);
  if (!parsed.success) {
    // Which service and which fields, so a browser that changes its push
    // service shows up in the logs; never the endpoint or the keys.
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))];
    console.warn(
      `notifications: refused a device from ${refusedPushServiceForLog(input)} (${fields.join(", ")})`,
    );
    return { status: "invalid" };
  }
  try {
    await createPushSubscriptionRepository(pushUserScope(session)).save(getDb(), parsed.data);
  } catch (error) {
    logWriteFailure("saving", error);
    return { status: "failed" };
  }
  return { status: "ok" };
}

export async function removePushSubscription(endpoint: unknown): Promise<SubscriptionWriteOutcome> {
  const session = await getCurrentSession();
  if (!session) {
    return { status: "unauthenticated" };
  }
  const parsed = pushEndpointSchema.safeParse(endpoint);
  if (!parsed.success) {
    return { status: "invalid" };
  }
  try {
    await createPushSubscriptionRepository(pushUserScope(session)).remove(getDb(), parsed.data);
  } catch (error) {
    logWriteFailure("removing", error);
    return { status: "failed" };
  }
  return { status: "ok" };
}

export type TestSendOutcome = SimpleOutcome<
  "sent" | "too_soon" | "not_found" | "gone" | "failed" | "unauthenticated" | "invalid" | "disabled"
>;

// Preferências' test button (ADR-0012): only to the device that asks, only
// the signed-in person's own, at most once a minute per device.
export async function sendTestPush(
  endpoint: unknown,
  sender: PushSender | null = senderFromEnv(),
): Promise<TestSendOutcome> {
  const session = await getCurrentSession();
  if (!session) {
    return { status: "unauthenticated" };
  }
  if (sender === null) {
    return { status: "disabled" };
  }
  const parsed = pushEndpointSchema.safeParse(endpoint);
  if (!parsed.success) {
    return { status: "invalid" };
  }
  const db = getDb();
  try {
    const claim = await createPushSubscriptionRepository(pushUserScope(session)).claimTestSend(
      db,
      parsed.data,
    );
    if (claim.status !== "claimed") {
      return { status: claim.status };
    }
    const delivery = await sender.send(claim.subscription, testPayload());
    switch (delivery) {
      case "delivered":
        return { status: "sent" };
      case "gone":
        await deleteGoneSubscription(db, claim.subscription);
        return { status: "gone" };
      case "failed":
        return { status: "failed" };
    }
  } catch (error) {
    console.warn(`notifications: a test send failed (${errorName(error)})`);
    return { status: "failed" };
  }
}

// ADR-0012: asking to delete the account stops every notification at once,
// in the same transaction that revokes the sessions.
export async function removePushSubscriptionsForAccountDeletion(
  db: DatabaseOrTransaction,
  session: CurrentSession,
): Promise<void> {
  await createPushSubscriptionRepository(pushUserScope(session)).removeAll(db);
}

// The device addresses are capabilities, not something to hand back: the
// export says which push service and since when, never the endpoint.
export async function getPushSubscriptionsForExport(
  session: CurrentSession,
  db: DatabaseOrTransaction = getDb(),
): Promise<Array<{ pushService: string; createdAt: Date }>> {
  const rows = await createPushSubscriptionRepository(pushUserScope(session)).list(db);
  return rows.map((row) => ({
    pushService: pushServiceHost(row.endpoint) ?? "unknown",
    createdAt: row.createdAt,
  }));
}
