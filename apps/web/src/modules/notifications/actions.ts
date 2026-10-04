"use server";

import {
  removePushSubscription,
  savePushSubscription,
  type SubscriptionWriteOutcome,
} from "./service";

export async function savePushSubscriptionAction(
  input: unknown,
): Promise<SubscriptionWriteOutcome> {
  return savePushSubscription(input);
}

export async function removePushSubscriptionAction(
  endpoint: unknown,
): Promise<SubscriptionWriteOutcome> {
  return removePushSubscription(endpoint);
}
