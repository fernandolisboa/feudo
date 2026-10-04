// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type FakeDevice = {
  support: "supported" | "needs_home_screen" | "unsupported";
  permission: NotificationPermission;
  current: PushSubscriptionJSON | null;
  owner: string | null;
  subscribe: ReturnType<typeof vi.fn>;
  unsubscribe: ReturnType<typeof vi.fn>;
};

const device = vi.hoisted((): FakeDevice => ({
  support: "supported",
  permission: "default",
  current: null,
  owner: null,
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));
const actions = vi.hoisted(() => ({ save: vi.fn(), remove: vi.fn() }));

vi.mock("@/platform/pwa/push-device", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/platform/pwa/push-device")>()),
  pushSupport: () => device.support,
  notificationPermission: () => device.permission,
  currentPushSubscription: () => Promise.resolve(device.current),
  isPushOwner: (userId: string) => device.owner === userId,
  subscribeThisDevice: device.subscribe,
  unsubscribeThisDevice: device.unsubscribe,
}));
vi.mock("../actions", () => ({
  savePushSubscriptionAction: actions.save,
  removePushSubscriptionAction: actions.remove,
}));

import { PushPermissionDeniedError } from "@/platform/pwa/push-device";

import { PushNotificationsSection } from "./push-notifications-section";

const SUBSCRIPTION: PushSubscriptionJSON = {
  endpoint: "https://fcm.googleapis.com/fcm/send/device",
  keys: { p256dh: "p", auth: "a" },
};

let online = true;

beforeEach(() => {
  online = true;
  Object.defineProperty(window.navigator, "onLine", { configurable: true, get: () => online });
  device.support = "supported";
  device.permission = "default";
  device.current = null;
  device.owner = null;
  device.subscribe.mockReset().mockResolvedValue(SUBSCRIPTION);
  device.unsubscribe.mockReset().mockResolvedValue(SUBSCRIPTION.endpoint);
  actions.save.mockReset().mockResolvedValue({ status: "ok" });
  actions.remove.mockReset().mockResolvedValue({ status: "ok" });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window.navigator, "onLine");
});

async function renderSection() {
  render(<PushNotificationsSection publicKey="PUBLIC" userId="user-a" />);
  return screen.findByRole("switch");
}

describe("PushNotificationsSection", () => {
  it("says what it notifies about and that it never shows amounts", async () => {
    await renderSection();
    expect(screen.getByText(/nunca mostram valores/)).toBeTruthy();
    expect(
      screen.getByRole("switch", { name: "Receber notificações neste aparelho" }),
    ).toBeTruthy();
  });

  it("turns notifications on: asks the browser, then saves the device", async () => {
    const toggle = await renderSection();

    fireEvent.click(toggle);

    expect(await screen.findByText("Notificações ativadas neste aparelho.")).toBeTruthy();
    expect(device.subscribe).toHaveBeenCalledWith("PUBLIC", "user-a");
    expect(actions.save).toHaveBeenCalledWith(SUBSCRIPTION);
    expect(toggle.getAttribute("aria-checked")).toBe("true");
  });

  it("when Feudo cannot save the device, the device stops too and says so", async () => {
    actions.save.mockResolvedValue({ status: "invalid" });
    const toggle = await renderSection();

    fireEvent.click(toggle);

    expect(
      await screen.findByText("Não foi possível ativar as notificações. Tente de novo."),
    ).toBeTruthy();
    expect(device.unsubscribe).toHaveBeenCalledOnce();
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  it("when the person blocks the browser's prompt, explains how to allow it", async () => {
    device.subscribe.mockRejectedValue(new PushPermissionDeniedError("denied"));
    const toggle = await renderSection();

    fireEvent.click(toggle);

    expect(await screen.findByText(/está bloqueando as notificações do Feudo/)).toBeTruthy();
    expect(actions.save).not.toHaveBeenCalled();
    expect(toggle.getAttribute("aria-disabled")).toBe("true");
  });

  it("when the person only closes the browser's prompt, asks to try again", async () => {
    device.subscribe.mockRejectedValue(new PushPermissionDeniedError("default"));
    const toggle = await renderSection();

    fireEvent.click(toggle);

    expect(await screen.findByText(/quando o navegador pergunta/)).toBeTruthy();
    expect(screen.queryByText(/está bloqueando/)).toBeNull();
    expect(toggle.getAttribute("aria-disabled")).not.toBe("true");
  });

  it("with notifications already blocked, the switch is off and disabled", async () => {
    device.permission = "denied";
    const toggle = await renderSection();
    expect(toggle.getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByText(/está bloqueando as notificações do Feudo/)).toBeTruthy();
  });

  it("shows a device this person turned on as on, and re-saves it", async () => {
    device.current = SUBSCRIPTION;
    device.owner = "user-a";
    const toggle = await renderSection();
    await waitFor(() => {
      expect(toggle.getAttribute("aria-checked")).toBe("true");
    });
    expect(actions.save).toHaveBeenCalledWith(SUBSCRIPTION);
  });

  it("never takes over a subscription someone else turned on in this browser", async () => {
    device.current = SUBSCRIPTION;
    device.owner = "user-b";
    const toggle = await renderSection();
    await act(() => Promise.resolve());

    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(actions.save).not.toHaveBeenCalled();
  });

  it("turns notifications off on Feudo and on the device", async () => {
    device.current = SUBSCRIPTION;
    device.owner = "user-a";
    const toggle = await renderSection();
    await waitFor(() => {
      expect(toggle.getAttribute("aria-checked")).toBe("true");
    });

    fireEvent.click(toggle);

    expect(await screen.findByText("Notificações desativadas neste aparelho.")).toBeTruthy();
    expect(actions.remove).toHaveBeenCalledWith(SUBSCRIPTION.endpoint);
    expect(device.unsubscribe).toHaveBeenCalledOnce();
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  it("once the device stops, says notifications are off even if Feudo could not be told", async () => {
    device.current = SUBSCRIPTION;
    device.owner = "user-a";
    actions.remove.mockRejectedValue(new Error("network"));
    const toggle = await renderSection();
    await waitFor(() => {
      expect(toggle.getAttribute("aria-checked")).toBe("true");
    });

    fireEvent.click(toggle);

    expect(await screen.findByText("Notificações desativadas neste aparelho.")).toBeTruthy();
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  it("offline, changes nothing", async () => {
    const toggle = await renderSection();
    online = false;

    act(() => {
      fireEvent.click(toggle);
    });

    expect(device.subscribe).not.toHaveBeenCalled();
    expect(actions.save).not.toHaveBeenCalled();
  });

  it("on iPhone Safari in a tab, explains the Home Screen step instead of a switch", async () => {
    device.support = "needs_home_screen";
    render(<PushNotificationsSection publicKey="PUBLIC" userId="user-a" />);
    expect(await screen.findByText(/adicione o Feudo à Tela de Início/)).toBeTruthy();
    expect(screen.queryByRole("switch")).toBeNull();
  });

  it("where the browser cannot receive notifications, says so", async () => {
    device.support = "unsupported";
    render(<PushNotificationsSection publicKey="PUBLIC" userId="user-a" />);
    expect(await screen.findByText("Este navegador não recebe notificações.")).toBeTruthy();
    expect(screen.queryByRole("switch")).toBeNull();
  });
});
