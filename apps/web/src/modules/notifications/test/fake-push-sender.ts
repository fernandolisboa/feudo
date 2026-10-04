import type { PushPayload } from "@/lib/push-payload";
import type { DatabaseOrTransaction } from "@/platform/db/client";

import { createPushSubscriptionRepository, type StoredPushSubscription } from "../repository";
import { scopeForUser } from "../scope";
import type { PushDelivery, PushSender } from "../sender";
import { createNotifier, type Notifier } from "../service";

export type FakePushSend = { endpoint: string; payload: PushPayload };

export type FakePushSender = PushSender & {
  sent: FakePushSend[];
  // Endpoints the fake push service answers as gone (404/410).
  gone: Set<string>;
};

export function createFakePushSender(): FakePushSender {
  const sent: FakePushSend[] = [];
  const gone = new Set<string>();
  return {
    sent,
    gone,
    send(subscription: StoredPushSubscription, payload: PushPayload): Promise<PushDelivery> {
      if (gone.has(subscription.endpoint)) {
        return Promise.resolve("gone");
      }
      sent.push({ endpoint: subscription.endpoint, payload });
      return Promise.resolve("delivered");
    },
  };
}

export function createFakeNotifier(): { notifier: Notifier; sender: FakePushSender } {
  const sender = createFakePushSender();
  return { notifier: createNotifier(sender), sender };
}

export const silentNotifier: Notifier = createNotifier(null);

let endpointCounter = 0;

// A subscription as Chrome hands one over, unique per call.
export function fakeSubscriptionInput(host = "fcm.googleapis.com") {
  endpointCounter += 1;
  return {
    endpoint: `https://${host}/fcm/send/test-${String(Date.now())}-${String(endpointCounter)}`,
    keys: {
      p256dh: "B".repeat(87),
      auth: "A".repeat(22),
    },
  };
}

// A device where this user turned notifications on, for other slices' tests.
export async function seedPushDevice(
  db: DatabaseOrTransaction,
  userId: string,
  host?: string,
): Promise<ReturnType<typeof fakeSubscriptionInput>> {
  const device = fakeSubscriptionInput(host);
  await createPushSubscriptionRepository(scopeForUser(userId)).save(db, device);
  return device;
}
