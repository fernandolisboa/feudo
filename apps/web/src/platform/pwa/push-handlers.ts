import { parsePushPayload, type PushPayload } from "@/lib/push-payload";

const NOTIFICATION_ICON = "/icons/icon-192.png";

function readJson(data: PushMessageData | null): unknown {
  try {
    return data?.json() ?? null;
  } catch {
    return null;
  }
}

export function payloadFromPush(data: PushMessageData | null): PushPayload | null {
  return parsePushPayload(readJson(data));
}

export function showPushNotification(
  registration: ServiceWorkerRegistration,
  payload: PushPayload,
): Promise<void> {
  return registration.showNotification(payload.title, {
    body: payload.body,
    tag: payload.tag,
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_ICON,
    data: { url: payload.url },
  });
}

function notificationUrl(notification: Notification): string {
  const url: unknown = (notification.data as { url?: unknown } | null)?.url;
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : "/";
}

// An open Feudo window is reused and moved to the screen the notification is
// about; only with none open does a new one start.
export async function openNotificationTarget(
  clients: Clients,
  origin: string,
  notification: Notification,
): Promise<void> {
  const target = new URL(notificationUrl(notification), origin).href;
  const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
  const open = windows.find((client) => new URL(client.url).origin === origin);
  if (open) {
    const focused = await open.focus();
    try {
      await focused.navigate(target);
      return;
    } catch {
      // A window this worker does not control refuses to be navigated.
    }
  }
  await clients.openWindow(target);
}
