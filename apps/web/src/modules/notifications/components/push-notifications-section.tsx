"use client";

import { useEffect, useState } from "react";

import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { SectionHeader } from "@/ui/section-header";
import { Switch } from "@/ui/switch";
import { blockWriteWhenOffline, isBrowserOffline } from "@/lib/offline-writes";
import {
  currentPushSubscription,
  isPushOwner,
  NoServiceWorkerError,
  notificationPermission,
  PushPermissionDeniedError,
  pushSupport,
  subscribeThisDevice,
  unsubscribeThisDevice,
  type PushSupport,
} from "@/platform/pwa/push-device";

import type { SubscriptionWriteOutcome } from "../service";
import {
  removePushSubscriptionAction,
  savePushSubscriptionAction,
  sendTestPushAction,
} from "../actions";
import { t } from "../strings";

type Message = { tone: "info" | "error"; text: string };

type DeviceState = { support: PushSupport; subscribed: boolean; denied: boolean };

// Chromium reports a refusal from its push service as an AbortError.
function subscribeFailureMessage(error: unknown): string {
  if (error instanceof NoServiceWorkerError) {
    return t.preferences.notReady;
  }
  if (error instanceof DOMException && error.name === "AbortError") {
    return t.preferences.subscribeFailed;
  }
  return t.preferences.failed;
}

function saveFailureMessage(status: SubscriptionWriteOutcome["status"] | undefined): string {
  switch (status) {
    case "unauthenticated":
      return t.preferences.unauthenticated;
    case "invalid":
      return t.preferences.serviceRefused;
    default:
      return t.preferences.failed;
  }
}

export function PushNotificationsSection({
  publicKey,
  userId,
}: {
  publicKey: string;
  userId: string;
}) {
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function readDevice(): Promise<void> {
      const support = pushSupport();
      if (support !== "supported") {
        setDevice({ support, subscribed: false, denied: false });
        return;
      }
      const subscription = await currentPushSubscription().catch(() => null);
      if (cancelled) {
        return;
      }
      // Only the person who turned them on here sees them on (ADR-0012):
      // someone else's subscription on this browser reads as off.
      const owned = subscription !== null && isPushOwner(userId);
      setDevice({
        support,
        subscribed: owned,
        denied: notificationPermission() === "denied",
      });
      // Keeps Feudo's copy current when the browser rotated the keys; never
      // re-saved for anyone but its owner, since a save moves the device.
      if (owned && !isBrowserOffline()) {
        void savePushSubscriptionAction(subscription).catch(() => undefined);
      }
    }
    void readDevice();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function turnOn(): Promise<void> {
    let subscription: PushSubscriptionJSON;
    try {
      subscription = await subscribeThisDevice(publicKey, userId);
    } catch (error) {
      if (error instanceof PushPermissionDeniedError) {
        const denied = error.permission === "denied";
        setDevice((current) => current && { ...current, denied });
        setMessage({
          tone: "error",
          text: denied ? t.preferences.denied : t.preferences.dismissed,
        });
        return;
      }
      setMessage({
        tone: "error",
        text: subscribeFailureMessage(error),
      });
      return;
    }
    const outcome = await savePushSubscriptionAction(subscription).catch(() => null);
    if (outcome?.status !== "ok") {
      // Feudo did not keep it, so the device must not keep receiving either.
      await unsubscribeThisDevice().catch(() => null);
      setMessage({ tone: "error", text: saveFailureMessage(outcome?.status) });
      return;
    }
    setDevice((current) => current && { ...current, subscribed: true, denied: false });
    setMessage({ tone: "info", text: t.preferences.enabled });
  }

  async function turnOff(): Promise<void> {
    const subscription = await currentPushSubscription().catch(() => null);
    if (subscription !== null) {
      // Feudo's copy goes best effort: once the device stops, a copy left
      // behind is deleted the first time a send meets the dead endpoint.
      await removePushSubscriptionAction(subscription.endpoint).catch(() => null);
    }
    const stopped = await unsubscribeThisDevice().then(
      () => true,
      () => false,
    );
    if (!stopped) {
      setMessage({ tone: "error", text: t.preferences.disableFailed });
      return;
    }
    setDevice((current) => current && { ...current, subscribed: false });
    setMessage({ tone: "info", text: t.preferences.disabled });
  }

  async function sendTest(): Promise<void> {
    const subscription = await currentPushSubscription().catch(() => null);
    const outcome = subscription
      ? await sendTestPushAction(subscription.endpoint).catch(() => null)
      : { status: "not_found" as const };
    switch (outcome?.status) {
      case "sent":
        setMessage({ tone: "info", text: t.preferences.testSent });
        return;
      case "too_soon":
        setMessage({ tone: "info", text: t.preferences.testTooSoon });
        return;
      case "not_found":
      case "gone":
        // Feudo no longer holds this device: the switch says so, and turning
        // it on again subscribes afresh.
        await unsubscribeThisDevice().catch(() => null);
        setDevice((current) => current && { ...current, subscribed: false });
        setMessage({ tone: "error", text: t.preferences.testLost });
        return;
      case "unauthenticated":
        setMessage({ tone: "error", text: t.preferences.unauthenticated });
        return;
      default:
        setMessage({ tone: "error", text: t.preferences.testFailed });
    }
  }

  function handleSendTest(): void {
    if (pending || blockWriteWhenOffline()) {
      return;
    }
    setPending(true);
    setMessage(null);
    void sendTest().finally(() => {
      setPending(false);
    });
  }

  function handleCheckedChange(next: boolean): void {
    if (pending || blockWriteWhenOffline()) {
      return;
    }
    setPending(true);
    setMessage(null);
    void (next ? turnOn() : turnOff()).finally(() => {
      setPending(false);
    });
  }

  const unavailable =
    device?.support === "needs_home_screen"
      ? t.preferences.needsHomeScreen
      : device?.support === "unsupported"
        ? t.preferences.unsupported
        : null;

  return (
    <section className="mt-8">
      <SectionHeader title={t.preferences.sectionTitle} />
      <div className="flex max-w-prose flex-col gap-1.5">
        {device === null || unavailable !== null ? null : (
          <div className="flex items-center gap-3">
            <Switch
              id="push-notifications"
              checked={device.subscribed}
              disabled={pending || (device.denied && !device.subscribed)}
              onCheckedChange={handleCheckedChange}
            />
            <Label htmlFor="push-notifications">{t.preferences.switchLabel}</Label>
          </div>
        )}
        <p className="text-muted-foreground text-sm">{t.preferences.description}</p>
        {device?.subscribed ? (
          <div className="mt-1.5">
            <Button variant="outline" disabled={pending} onClick={handleSendTest}>
              {t.preferences.sendTest}
            </Button>
          </div>
        ) : null}
        {unavailable === null ? null : <p className="text-sm">{unavailable}</p>}
        {device?.denied && !device.subscribed && message === null ? (
          <p className="text-sm">{t.preferences.denied}</p>
        ) : null}
        {message === null ? null : (
          <p
            role="status"
            className={
              message.tone === "error"
                ? "text-destructive text-sm"
                : "text-muted-foreground text-sm"
            }
          >
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
}
