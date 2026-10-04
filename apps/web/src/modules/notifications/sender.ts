import type { PushPayload } from "@/lib/push-payload";

import type { StoredPushSubscription } from "./repository";

// "gone": the push service says the subscription no longer exists, so it is
// deleted; "failed": anything else, dropped without retry (ADR-0012).
export type PushDelivery = "delivered" | "gone" | "failed";

export interface PushSender {
  send(subscription: StoredPushSubscription, payload: PushPayload): Promise<PushDelivery>;
}
