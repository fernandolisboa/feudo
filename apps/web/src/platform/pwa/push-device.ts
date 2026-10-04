import { FORGET_PUSH_DEVICE_PATH, forgetPushDeviceBody } from "@/lib/push-payload";

export type PushSupport = "supported" | "needs_home_screen" | "unsupported";

export class PushPermissionDeniedError extends Error {
  readonly permission: NotificationPermission;

  constructor(permission: NotificationPermission) {
    super("Notification permission was not granted.");
    this.name = "PushPermissionDeniedError";
    this.permission = permission;
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

const PUSH_OWNER_KEY = "feudo.push.owner";
const SERVICE_WORKER_READY_MS = 10_000;
const FORGET_DEVICE_TIMEOUT_MS = 5_000;

// Who turned notifications on in this browser (ADR-0012). Kept apart from the
// offline-copy scope, which the sign-in pages clear, so the next person to
// sign in here can still be told apart from the one who subscribed.
function readPushOwner(): string | null {
  try {
    return window.localStorage.getItem(PUSH_OWNER_KEY);
  } catch {
    return null;
  }
}

function writePushOwner(userId: string | null): void {
  try {
    if (userId === null) {
      window.localStorage.removeItem(PUSH_OWNER_KEY);
    } else {
      window.localStorage.setItem(PUSH_OWNER_KEY, userId);
    }
  } catch {
    // Storage refused: the subscription simply reads as nobody's.
  }
}

export function isPushOwner(userId: string): boolean {
  return readPushOwner() === userId;
}

export function isPushOwnedBySomeoneElse(userId: string): boolean {
  const owner = readPushOwner();
  return owner !== null && owner !== userId;
}

async function pushManager(): Promise<PushManager | null> {
  if (!("serviceWorker" in navigator)) {
    return null;
  }
  const registration = await navigator.serviceWorker.getRegistration();
  return registration?.pushManager ?? null;
}

// Subscribing needs an active worker, which a first visit may still be
// installing; `ready` never settles where no worker registers at all.
async function activePushManager(): Promise<PushManager | null> {
  if (!("serviceWorker" in navigator)) {
    return null;
  }
  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, SERVICE_WORKER_READY_MS);
    }),
  ]);
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

function madeWithKey(subscription: PushSubscription, key: Uint8Array): boolean {
  const current = subscription.options.applicationServerKey;
  if (current === null) {
    return false;
  }
  const bytes = new Uint8Array(current);
  return bytes.length === key.length && bytes.every((byte, index) => byte === key[index]);
}

export async function subscribeThisDevice(
  publicKey: string,
  userId: string,
): Promise<PushSubscriptionJSON> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new PushPermissionDeniedError(permission);
  }
  const manager = await activePushManager();
  if (manager === null) {
    throw new NoServiceWorkerError();
  }
  const key = applicationServerKey(publicKey);
  const existing = await manager.getSubscription();
  // One made with an earlier key is refused by the push service for good.
  if (existing !== null && !madeWithKey(existing, key)) {
    await existing.unsubscribe();
  }
  const subscription =
    existing !== null && madeWithKey(existing, key)
      ? existing
      : await manager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  writePushOwner(userId);
  return subscription.toJSON();
}

// The endpoint the device just gave up, so the server can forget it too.
// The owner goes only once the browser has stopped: kept on a failure, the
// next person to sign in here still unsubscribes it (ADR-0012).
export async function unsubscribeThisDevice(): Promise<string | null> {
  const manager = await pushManager();
  const subscription = await manager?.getSubscription();
  await subscription?.unsubscribe();
  writePushOwner(null);
  return subscription?.endpoint ?? null;
}

// Sign-out (ADR-0012): the browser stops first, then Feudo forgets the
// address while the session still exists to say whose it is.
export async function forgetThisDevice(): Promise<void> {
  const endpoint = await unsubscribeThisDevice();
  if (endpoint === null) {
    return;
  }
  await fetch(FORGET_PUSH_DEVICE_PATH, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(forgetPushDeviceBody(endpoint)),
    signal: AbortSignal.timeout(FORGET_DEVICE_TIMEOUT_MS),
  });
}
