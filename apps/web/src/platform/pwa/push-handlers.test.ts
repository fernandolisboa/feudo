import { describe, expect, it, vi } from "vitest";

import { openNotificationTarget, payloadFromPush, showPushNotification } from "./push-handlers";

const ORIGIN = "https://feudo.test";
const payload = {
  title: "A meta da reserva mudou",
  body: "Casa: mudou.",
  url: "/reserva",
  tag: "t1",
};

function pushData(value: unknown): PushMessageData {
  return {
    json: () => {
      if (value instanceof Error) {
        throw value;
      }
      return value;
    },
  } as PushMessageData;
}

function notificationWith(data: unknown): Notification {
  return { data } as Notification;
}

type FakeWindow = {
  url: string;
  focus: ReturnType<typeof vi.fn>;
  navigate: ReturnType<typeof vi.fn>;
};

function fakeClients(windows: FakeWindow[]) {
  const openWindow = vi.fn(() => Promise.resolve(null));
  const clients = {
    matchAll: vi.fn(() => Promise.resolve(windows)),
    openWindow,
  } as unknown as Clients;
  return { clients, openWindow };
}

function fakeWindow(url: string, navigate = vi.fn(() => Promise.resolve(null))): FakeWindow {
  const window: FakeWindow = { url, navigate, focus: vi.fn() };
  window.focus.mockResolvedValue(window);
  return window;
}

describe("payloadFromPush", () => {
  it("reads the notification Feudo sent", () => {
    expect(payloadFromPush(pushData(payload))).toEqual(payload);
  });

  it.each([
    ["no data", null],
    ["data that is not JSON", pushData(new SyntaxError("bad"))],
    ["a link out of Feudo", pushData({ ...payload, url: "https://elsewhere.test" })],
  ])("shows nothing for %s", (_label, data) => {
    expect(payloadFromPush(data)).toBeNull();
  });
});

describe("showPushNotification", () => {
  it("shows the title and body, replaces an earlier one with the same tag and remembers where to go", async () => {
    const showNotification = vi.fn(() => Promise.resolve());
    await showPushNotification(
      { showNotification } as unknown as ServiceWorkerRegistration,
      payload,
    );
    expect(showNotification).toHaveBeenCalledWith("A meta da reserva mudou", {
      body: "Casa: mudou.",
      tag: "t1",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: "/reserva" },
    });
  });
});

describe("openNotificationTarget", () => {
  it("reuses an open Feudo window and moves it to the screen", async () => {
    const open = fakeWindow(`${ORIGIN}/transacoes`);
    const { clients, openWindow } = fakeClients([fakeWindow("https://elsewhere.test/"), open]);

    await openNotificationTarget(clients, ORIGIN, notificationWith({ url: "/reserva" }));

    expect(open.focus).toHaveBeenCalledOnce();
    expect(open.navigate).toHaveBeenCalledWith(`${ORIGIN}/reserva`);
    expect(openWindow).not.toHaveBeenCalled();
  });

  it("opens a window when none is open", async () => {
    const { clients, openWindow } = fakeClients([]);
    await openNotificationTarget(clients, ORIGIN, notificationWith({ url: "/reserva" }));
    expect(openWindow).toHaveBeenCalledWith(`${ORIGIN}/reserva`);
  });

  it("opens a window when the open one refuses to be navigated", async () => {
    const open = fakeWindow(
      `${ORIGIN}/`,
      vi.fn(() => Promise.reject(new TypeError("not controlled"))),
    );
    const { clients, openWindow } = fakeClients([open]);
    await openNotificationTarget(clients, ORIGIN, notificationWith({ url: "/reserva" }));
    expect(openWindow).toHaveBeenCalledWith(`${ORIGIN}/reserva`);
  });

  it.each([{ url: "https://elsewhere.test/" }, { url: "//elsewhere.test" }, null])(
    "goes to the overview instead of a stored address out of Feudo (%o)",
    async (data) => {
      const { clients, openWindow } = fakeClients([]);
      await openNotificationTarget(clients, ORIGIN, notificationWith(data));
      expect(openWindow).toHaveBeenCalledWith(`${ORIGIN}/`);
    },
  );
});
