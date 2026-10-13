import { describe, expect, it } from "vitest";

import {
  pushServiceHost,
  pushSubscriptionInputSchema,
  refusedPushServiceForLog,
} from "./validation";

const keys = { p256dh: "B".repeat(87), auth: "A".repeat(22) };

describe("pushServiceHost", () => {
  it.each([
    "https://fcm.googleapis.com/fcm/send/abc",
    "https://jmt17.google.com/fcm/send/abc",
    "https://web.push.apple.com/QGx",
    "https://wns2-bl2p.notify.windows.com/w/?token=abc",
    "https://updates.push.services.mozilla.com/wpush/v2/abc",
  ])("accepts a browser push service: %s", (endpoint) => {
    expect(pushServiceHost(endpoint)).not.toBeNull();
  });

  it.each([
    ["plain http", "http://fcm.googleapis.com/fcm/send/abc"],
    ["another host", "https://feudo.vercel.app/api/health"],
    ["an internal address", "https://169.254.169.254/latest/meta-data"],
    ["a look-alike suffix", "https://notify.windows.com.evil.test/x"],
    ["a look-alike prefix", "https://evilfcm.googleapis.com/x"],
    ["another google.com host", "https://mail.google.com/fcm/send/abc"],
    ["an unnumbered jmt host", "https://jmt.google.com/fcm/send/abc"],
    ["a numbered look-alike", "https://evil-jmt17.google.com/fcm/send/abc"],
    ["a numbered look-alike suffix", "https://jmt17.google.com.evil.test/fcm/send/abc"],
    ["a port", "https://fcm.googleapis.com:8443/fcm/send/abc"],
    ["credentials", "https://user:pass@fcm.googleapis.com/fcm/send/abc"],
    ["not a URL", "fcm.googleapis.com/fcm/send/abc"],
  ])("refuses %s", (_label, endpoint) => {
    expect(pushServiceHost(endpoint)).toBeNull();
  });
});

describe("pushSubscriptionInputSchema", () => {
  // The shape Chromium's PushSubscription.toJSON returns on jmt17.google.com,
  // with synthetic token and keys.
  it("accepts a Chrome subscription on jmt17.google.com", () => {
    const input = {
      endpoint: `https://jmt17.google.com/fcm/send/fakeToken123:APA91b${"x".repeat(140)}`,
      expirationTime: null,
      keys: { p256dh: `B${"Q".repeat(86)}`, auth: "c".repeat(22) },
    };
    expect(pushSubscriptionInputSchema.safeParse(input).success).toBe(true);
  });

  it("accepts what PushSubscription.toJSON hands over", () => {
    const input = {
      endpoint: "https://fcm.googleapis.com/fcm/send/abc",
      expirationTime: null,
      keys,
    };
    expect(pushSubscriptionInputSchema.safeParse(input).success).toBe(true);
  });

  it.each([
    ["an unknown host", { endpoint: "https://elsewhere.test/x", keys }],
    [
      "a short public key",
      { endpoint: "https://fcm.googleapis.com/x", keys: { ...keys, p256dh: "B" } },
    ],
    [
      "a key that is not base64url",
      {
        endpoint: "https://fcm.googleapis.com/x",
        keys: { ...keys, auth: "<script>alert(1)</script>" },
      },
    ],
    ["a missing key", { endpoint: "https://fcm.googleapis.com/x", keys: { p256dh: keys.p256dh } }],
    ["an oversized endpoint", { endpoint: `https://fcm.googleapis.com/${"a".repeat(2100)}`, keys }],
  ])("refuses %s", (_label, input) => {
    expect(pushSubscriptionInputSchema.safeParse(input).success).toBe(false);
  });
});

describe("refusedPushServiceForLog", () => {
  it.each([
    [
      "an unknown host",
      { endpoint: "https://Push.Example.test/secret-token", keys },
      "push.example.test",
    ],
    ["an endpoint that is not a URL", { endpoint: "not a url" }, "unparseable endpoint"],
    ["a missing endpoint", { keys }, "no endpoint"],
    ["no input", null, "no endpoint"],
  ])("names %s without its path", (_label, input, named) => {
    expect(refusedPushServiceForLog(input)).toBe(named);
  });
});
