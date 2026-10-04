"use client";

import { useEffect, useState } from "react";

import { Label } from "@/ui/label";
import { SectionHeader } from "@/ui/section-header";
import { Switch } from "@/ui/switch";
import { blockWriteWhenOffline, isBrowserOffline } from "@/lib/offline-writes";
import {
  currentPushSubscription,
  notificationPermission,
  PushPermissionDeniedError,
  pushSupport,
  subscribeThisDevice,
  unsubscribeThisDevice,
  type PushSupport,
} from "@/platform/pwa/push-device";

import { removePushSubscriptionAction, savePushSubscriptionAction } from "../actions";
import { t } from "../strings";

type Message = { tone: "info" | "error"; text: string };

type DeviceState = { support: PushSupport; subscribed: boolean; denied: boolean };

export function PushNotificationsSection({ publicKey }: { publicKey: string }) {
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
      setDevice({
        support,
        subscribed: subscription !== null,
        denied: notificationPermission() === "denied",
      });
      // Re-saving what the browser holds now keeps Feudo's copy current when
      // the browser rotated it, or when another person used this device.
      if (subscription !== null && !isBrowserOffline()) {
        void savePushSubscriptionAction(subscription).catch(() => undefined);
      }
    }
    void readDevice();
    return () => {
      cancelled = true;
    };
  }, []);

  async function turnOn(): Promise<void> {
    let subscription: PushSubscriptionJSON;
    try {
      subscription = await subscribeThisDevice(publicKey);
    } catch (error) {
      if (error instanceof PushPermissionDeniedError) {
        setDevice(
          (current) => current && { ...current, denied: notificationPermission() === "denied" },
        );
        setMessage({ tone: "error", text: t.preferences.denied });
        return;
      }
      setMessage({ tone: "error", text: t.preferences.failed });
      return;
    }
    const outcome = await savePushSubscriptionAction(subscription).catch(() => null);
    if (outcome?.status !== "ok") {
      // Feudo did not keep it, so the device must not keep receiving either.
      await unsubscribeThisDevice().catch(() => null);
      setMessage({
        tone: "error",
        text:
          outcome?.status === "unauthenticated"
            ? t.preferences.unauthenticated
            : t.preferences.failed,
      });
      return;
    }
    setDevice((current) => current && { ...current, subscribed: true, denied: false });
    setMessage({ tone: "info", text: t.preferences.enabled });
  }

  async function turnOff(): Promise<void> {
    const subscription = await currentPushSubscription().catch(() => null);
    const outcome = subscription
      ? await removePushSubscriptionAction(subscription.endpoint).catch(() => null)
      : { status: "ok" as const };
    // The device stops either way: a subscription Feudo still holds for a
    // dead endpoint is deleted the first time a send meets it.
    await unsubscribeThisDevice().catch(() => null);
    setDevice((current) => current && { ...current, subscribed: false });
    setMessage(
      outcome?.status === "ok"
        ? { tone: "info", text: t.preferences.disabled }
        : { tone: "error", text: t.preferences.disableFailed },
    );
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
