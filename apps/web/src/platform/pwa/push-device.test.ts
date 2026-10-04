// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  currentPushSubscription,
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
  toJSON: () => PushSubscriptionJSON;
  unsubscribe: ReturnType<typeof vi.fn>;
};

function fakeSubscription(endpoint: string): FakeSubscription {
  return {
    endpoint,
    toJSON: () => ({ endpoint, keys: { p256dh: "p", auth: "a" } }),
    unsubscribe: vi.fn(() => Promise.resolve(true)),
  };
}

let existing: FakeSubscription | null;
const subscribe = vi.fn();
let requestPermission: ReturnType<typeof vi.fn>;

function installPush({ registration = true }: { registration?: boolean } = {}): void {
  Object.defineProperty(window.navigator, "serviceWorker", {
    configurable: true,
    value: {
      getRegistration: () =>
        Promise.resolve(
          registration
            ? { pushManager: { getSubscription: () => Promise.resolve(existing), subscribe } }
            : undefined,
        ),
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
  window.matchMedia = vi.fn(() => ({ matches: false }) as MediaQueryList);
});

afterEach(() => {
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

    const json = await subscribeThisDevice("AQID-_8");

    expect(requestPermission).toHaveBeenCalledOnce();
    const options = subscribe.mock.calls[0]?.[0] as PushSubscriptionOptionsInit;
    expect(options.userVisibleOnly).toBe(true);
    expect(Array.from(options.applicationServerKey as Uint8Array)).toEqual([1, 2, 3, 251, 255]);
    expect(json.endpoint).toBe("https://fcm.googleapis.com/x");
  });

  it("reuses the subscription the device already has", async () => {
    installPush();
    existing = fakeSubscription("https://fcm.googleapis.com/existing");
    expect((await subscribeThisDevice("AQID")).endpoint).toBe(
      "https://fcm.googleapis.com/existing",
    );
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("stops when the person does not allow notifications", async () => {
    installPush();
    requestPermission.mockResolvedValue("denied");
    await expect(subscribeThisDevice("AQID")).rejects.toBeInstanceOf(PushPermissionDeniedError);
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("stops when no service worker is registered", async () => {
    installPush({ registration: false });
    await expect(subscribeThisDevice("AQID")).rejects.toBeInstanceOf(NoServiceWorkerError);
  });
});

describe("unsubscribeThisDevice", () => {
  it("drops the device's subscription and says which endpoint went", async () => {
    installPush();
    existing = fakeSubscription("https://fcm.googleapis.com/gone");
    const subscription = existing;

    expect(await unsubscribeThisDevice()).toBe("https://fcm.googleapis.com/gone");
    expect(subscription.unsubscribe).toHaveBeenCalledOnce();
  });

  it("does nothing without a subscription or a service worker", async () => {
    installPush();
    expect(await unsubscribeThisDevice()).toBeNull();
    expect(await currentPushSubscription()).toBeNull();
    Reflect.deleteProperty(window.navigator, "serviceWorker");
    expect(await unsubscribeThisDevice()).toBeNull();
  });
});
