import { sendNotification, WebPushError } from "web-push";

import { errorName } from "@/lib/error-name";
import type { PushPayload } from "@/lib/push-payload";

import type { StoredPushSubscription } from "./repository";
import type { PushDelivery, PushSender } from "./sender";

export type VapidKeys = { subject: string; publicKey: string; privateKey: string };

// A notification about the month or a failing sync is still worth showing a
// day late, not later.
const TIME_TO_LIVE_SECONDS = 24 * 60 * 60;

// The jobs that send run under a deadline: one stalled push service must not
// hold them (a socket idle timeout, per web-push).
const SEND_TIMEOUT_MS = 5_000;

export function createWebPushSender(
  vapid: VapidKeys,
  send: typeof sendNotification = sendNotification,
): PushSender {
  return {
    async send(subscription: StoredPushSubscription, payload: PushPayload): Promise<PushDelivery> {
      try {
        await send(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify(payload),
          {
            vapidDetails: vapid,
            TTL: TIME_TO_LIVE_SECONDS,
            urgency: "normal",
            timeout: SEND_TIMEOUT_MS,
          },
        );
        return "delivered";
      } catch (error) {
        if (
          error instanceof WebPushError &&
          (error.statusCode === 404 || error.statusCode === 410)
        ) {
          return "gone";
        }
        // The endpoint is an address only this device should know: it stays
        // out of the log.
        const status = error instanceof WebPushError ? ` status=${String(error.statusCode)}` : "";
        console.warn(`notifications: push send failed (${errorName(error)}${status})`);
        return "failed";
      }
    },
  };
}
