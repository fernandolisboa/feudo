export type PushSupport = "supported" | "needs_home_screen" | "unsupported";

export class PushPermissionDeniedError extends Error {
  constructor() {
    super("Notification permission was not granted.");
    this.name = "PushPermissionDeniedError";
  }
}

export class NoServiceWorkerError extends Error {
  constructor() {
    super("No service worker controls this page.");
    this.name = "NoServiceWorkerError";
  }
}

function isAppleMobile(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1)
  );
}

function isInstalled(): boolean {
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || window.matchMedia("(display-mode: standalone)").matches;
}

// Safari on iPhone offers push only to a web app opened from the Home Screen
// (ADR-0012), so in the browser tab it says how instead of failing.
export function pushSupport(): PushSupport {
  if ("serviceWorker" in navigator && "PushManager" in window && "Notification" in window) {
    return "supported";
  }
  return isAppleMobile() && !isInstalled() ? "needs_home_screen" : "unsupported";
}

export function notificationPermission(): NotificationPermission {
  return "Notification" in window ? Notification.permission : "default";
}

async function pushManager(): Promise<PushManager | null> {
  if (!("serviceWorker" in navigator)) {
    return null;
  }
  const registration = await navigator.serviceWorker.getRegistration();
  return registration?.pushManager ?? null;
}

function applicationServerKey(publicKey: string): Uint8Array<ArrayBuffer> {
  const base64 = publicKey.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function currentPushSubscription(): Promise<PushSubscriptionJSON | null> {
  const manager = await pushManager();
  const subscription = await manager?.getSubscription();
  return subscription ? subscription.toJSON() : null;
}

export async function subscribeThisDevice(publicKey: string): Promise<PushSubscriptionJSON> {
  if ((await Notification.requestPermission()) !== "granted") {
    throw new PushPermissionDeniedError();
  }
  const manager = await pushManager();
  if (manager === null) {
    throw new NoServiceWorkerError();
  }
  const subscription =
    (await manager.getSubscription()) ??
    (await manager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey(publicKey),
    }));
  return subscription.toJSON();
}

// The endpoint the device just gave up, so the server can forget it too.
export async function unsubscribeThisDevice(): Promise<string | null> {
  const manager = await pushManager();
  const subscription = await manager?.getSubscription();
  if (!subscription) {
    return null;
  }
  await subscription.unsubscribe();
  return subscription.endpoint;
}
