"use server";

import {
  removePushSubscription,
  savePushSubscription,
  sendTestPush,
  type SubscriptionWriteOutcome,
  type TestSendOutcome,
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

export async function sendTestPushAction(endpoint: unknown): Promise<TestSendOutcome> {
  return sendTestPush(endpoint);
}
