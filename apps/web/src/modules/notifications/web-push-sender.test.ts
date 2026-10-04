import { WebPushError } from "web-push";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createWebPushSender } from "./web-push-sender";

const vapid = { subject: "mailto:feudo@miolos.app", publicKey: "pub", privateKey: "priv" };
const subscription = {
  id: "s1",
  endpoint: "https://fcm.googleapis.com/fcm/send/secret-device-token",
  p256dh: "p256dh-key",
  auth: "auth-key",
};
const payload = { title: "Título", body: "Corpo", url: "/reserva", tag: "t" };

function rejected(statusCode: number): WebPushError {
  return new WebPushError("push failed", statusCode, {}, "", subscription.endpoint);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createWebPushSender", () => {
  it("sends the payload encrypted to the device, signed with the VAPID keys", async () => {
    const send = vi.fn().mockResolvedValue({ statusCode: 201, body: "", headers: {} });
    const sender = createWebPushSender(vapid, send);

    expect(await sender.send(subscription, payload)).toBe("delivered");
    expect(send).toHaveBeenCalledWith(
      { endpoint: subscription.endpoint, keys: { p256dh: "p256dh-key", auth: "auth-key" } },
      JSON.stringify(payload),
      expect.objectContaining({ vapidDetails: vapid, TTL: 86400, timeout: 5000 }),
    );
  });

  it.each([404, 410])(
    "reports a subscription the push service no longer has (%i) as gone",
    async (status) => {
      const sender = createWebPushSender(vapid, vi.fn().mockRejectedValue(rejected(status)));
      expect(await sender.send(subscription, payload)).toBe("gone");
    },
  );

  it("reports any other failure as failed and keeps the device address out of the log", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const sender = createWebPushSender(vapid, vi.fn().mockRejectedValue(rejected(500)));

    expect(await sender.send(subscription, payload)).toBe("failed");
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0]?.[0])).toContain("status=500");
    expect(String(warn.mock.calls[0]?.[0])).not.toContain("secret-device-token");
  });

  it("reports a network error as failed", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const sender = createWebPushSender(vapid, vi.fn().mockRejectedValue(new Error("ECONNRESET")));
    expect(await sender.send(subscription, payload)).toBe("failed");
  });
});
