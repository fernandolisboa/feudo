// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  currentPushSubscription,
  forgetThisDevice,
  isPushOwnedBySomeoneElse,
  isPushOwner,
  NoServiceWorkerError,
  PushPermissionDeniedError,
  pushSupport,
  subscribeThisDevice,
  unsubscribeThisDevice,
} from "./push-device";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

type FakeSubscription = {
  endpoint: string;
  options: { applicationServerKey: ArrayBuffer | null };
  toJSON: () => PushSubscriptionJSON;
  unsubscribe: ReturnType<typeof vi.fn>;
};

// "AQID" decodes to these bytes.
const KEY_AQID = [1, 2, 3];

function fakeSubscription(endpoint: string, key: number[] = KEY_AQID): FakeSubscription {
  return {
    endpoint,
    options: { applicationServerKey: new Uint8Array(key).buffer },
    toJSON: () => ({ endpoint, keys: { p256dh: "p", auth: "a" } }),
    unsubscribe: vi.fn(() => Promise.resolve(true)),
  };
}

let existing: FakeSubscription | null;
const subscribe = vi.fn();
let requestPermission: ReturnType<typeof vi.fn>;

function installPush({ registration = true }: { registration?: boolean } = {}): void {
  const found = { pushManager: { getSubscription: () => Promise.resolve(existing), subscribe } };
  Object.defineProperty(window.navigator, "serviceWorker", {
    configurable: true,
    value: {
      getRegistration: () => Promise.resolve(registration ? found : undefined),
      ready: registration ? Promise.resolve(found) : new Promise(() => undefined),
    },
  });
  Object.defineProperty(window, "PushManager", { configurable: true, value: {} });
  requestPermission = vi.fn(() => Promise.resolve("granted"));
  Object.defineProperty(window, "Notification", {
    configurable: true,
    value: { permission: "default", requestPermission },
  });
}

function setUserAgent(userAgent: string): void {
  Object.defineProperty(window.navigator, "userAgent", { configurable: true, value: userAgent });
}

beforeEach(() => {
  existing = null;
  subscribe.mockReset();
  window.localStorage.clear();
  window.matchMedia = vi.fn(() => ({ matches: false }) as MediaQueryList);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(window.navigator, "serviceWorker");
  Reflect.deleteProperty(window.navigator, "userAgent");
  Reflect.deleteProperty(window, "PushManager");
  Reflect.deleteProperty(window, "Notification");
});

describe("pushSupport", () => {
  it("is supported where the browser has service workers, push and notifications", () => {
    installPush();
    expect(pushSupport()).toBe("supported");
  });

  it("on iPhone Safari in a tab, says to add Feudo to the Home Screen", () => {
    setUserAgent(IPHONE_UA);
    expect(pushSupport()).toBe("needs_home_screen");
  });

  it("on an iPhone already opened from the Home Screen without push, is simply unsupported", () => {
    setUserAgent(IPHONE_UA);
    window.matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList);
    expect(pushSupport()).toBe("unsupported");
  });

  it("elsewhere without push, is unsupported", () => {
    setUserAgent("Mozilla/5.0 (Windows NT 10.0) Old/1.0");
    expect(pushSupport()).toBe("unsupported");
  });
});

describe("subscribeThisDevice", () => {
  it("asks for permission, then subscribes with Feudo's key decoded from base64url", async () => {
    installPush();
    subscribe.mockResolvedValue(fakeSubscription("https://fcm.googleapis.com/x"));

    const json = await subscribeThisDevice("AQID-_8", "user-a");

    expect(requestPermission).toHaveBeenCalledOnce();
    const options = subscribe.mock.calls[0]?.[0] as PushSubscriptionOptionsInit;
    expect(options.userVisibleOnly).toBe(true);
    expect(Array.from(options.applicationServerKey as Uint8Array)).toEqual([1, 2, 3, 251, 255]);
    expect(json.endpoint).toBe("https://fcm.googleapis.com/x");
  });

  it("remembers who turned notifications on in this browser", async () => {
    installPush();
    subscribe.mockResolvedValue(fakeSubscription("https://fcm.googleapis.com/x"));

    await subscribeThisDevice("AQID", "user-a");

    expect(isPushOwner("user-a")).toBe(true);
    expect(isPushOwnedBySomeoneElse("user-a")).toBe(false);
    expect(isPushOwnedBySomeoneElse("user-b")).toBe(true);
  });

  it("reuses the subscription the device already has with the same key", async () => {
    installPush();
    existing = fakeSubscription("https://fcm.googleapis.com/existing");
    expect((await subscribeThisDevice("AQID", "user-a")).endpoint).toBe(
      "https://fcm.googleapis.com/existing",
    );
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("replaces a subscription made with an earlier key", async () => {
    installPush();
    const stale = fakeSubscription("https://fcm.googleapis.com/stale", [9, 9, 9]);
    existing = stale;
    subscribe.mockResolvedValue(fakeSubscription("https://fcm.googleapis.com/fresh"));

    expect((await subscribeThisDevice("AQID", "user-a")).endpoint).toBe(
      "https://fcm.googleapis.com/fresh",
    );
    expect(stale.unsubscribe).toHaveBeenCalledOnce();
  });

  it.each(["denied", "default"] as const)(
    "stops, saying how, when the permission comes back %s",
    async (permission) => {
      installPush();
      requestPermission.mockResolvedValue(permission);
      const error: unknown = await subscribeThisDevice("AQID", "user-a").catch(
        (thrown: unknown) => thrown,
      );
      expect(error).toBeInstanceOf(PushPermissionDeniedError);
      expect((error as PushPermissionDeniedError).permission).toBe(permission);
      expect(subscribe).not.toHaveBeenCalled();
      expect(isPushOwner("user-a")).toBe(false);
    },
  );

  it("stops when no service worker becomes active", async () => {
    vi.useFakeTimers();
    installPush({ registration: false });
    const subscribing = expect(subscribeThisDevice("AQID", "user-a")).rejects.toBeInstanceOf(
      NoServiceWorkerError,
    );
    await vi.advanceTimersByTimeAsync(10_000);
    await subscribing;
  });
});

describe("unsubscribeThisDevice", () => {
  it("drops the device's subscription and its owner, and says which endpoint went", async () => {
    installPush();
    window.localStorage.setItem("feudo.push.owner", "user-a");
    existing = fakeSubscription("https://fcm.googleapis.com/gone");
    const subscription = existing;

    expect(await unsubscribeThisDevice()).toBe("https://fcm.googleapis.com/gone");
    expect(subscription.unsubscribe).toHaveBeenCalledOnce();
    expect(isPushOwnedBySomeoneElse("user-b")).toBe(false);
  });

  it("does nothing without a subscription or a service worker", async () => {
    installPush();
    expect(await unsubscribeThisDevice()).toBeNull();
    expect(await currentPushSubscription()).toBeNull();
    Reflect.deleteProperty(window.navigator, "serviceWorker");
    expect(await unsubscribeThisDevice()).toBeNull();
  });
});

describe("forgetThisDevice", () => {
  it("stops the browser, then asks Feudo to forget that endpoint", async () => {
    installPush();
    existing = fakeSubscription("https://fcm.googleapis.com/mine");
    const subscription = existing;
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal("fetch", fetchMock);

    await forgetThisDevice();

    expect(subscription.unsubscribe).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledOnce();
    const [path, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(path).toBe("/api/push-subscription");
    expect(init.method).toBe("DELETE");
    expect(init.body).toBe(JSON.stringify({ endpoint: "https://fcm.googleapis.com/mine" }));
  });

  it("asks nothing of Feudo when this browser had no subscription", async () => {
    installPush();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await forgetThisDevice();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
