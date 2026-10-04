import { describe, expect, it } from "vitest";

import { InvalidVapidConfigError, readVapidKeys } from "./env";

const PUBLIC_KEY = `B${"x".repeat(86)}`;
const PRIVATE_KEY = "y".repeat(43);

describe("readVapidKeys", () => {
  it("is off with no keys", () => {
    expect(readVapidKeys({})).toBeNull();
    expect(readVapidKeys({ VAPID_PUBLIC_KEY: " ", VAPID_PRIVATE_KEY: "" })).toBeNull();
  });

  it("reads both keys and defaults the contact to Feudo's address", () => {
    expect(readVapidKeys({ VAPID_PUBLIC_KEY: PUBLIC_KEY, VAPID_PRIVATE_KEY: PRIVATE_KEY })).toEqual(
      {
        publicKey: PUBLIC_KEY,
        privateKey: PRIVATE_KEY,
        subject: "mailto:feudo@miolos.app",
      },
    );
  });

  it("takes the contact from VAPID_SUBJECT", () => {
    expect(
      readVapidKeys({
        VAPID_PUBLIC_KEY: PUBLIC_KEY,
        VAPID_PRIVATE_KEY: PRIVATE_KEY,
        VAPID_SUBJECT: "https://feudo.vercel.app",
      })?.subject,
    ).toBe("https://feudo.vercel.app");
  });

  it.each([
    ["only the public key", { VAPID_PUBLIC_KEY: PUBLIC_KEY }],
    ["only the private key", { VAPID_PRIVATE_KEY: PRIVATE_KEY }],
    ["a malformed key", { VAPID_PUBLIC_KEY: "short", VAPID_PRIVATE_KEY: PRIVATE_KEY }],
    [
      "a contact that is not an address",
      { VAPID_PUBLIC_KEY: PUBLIC_KEY, VAPID_PRIVATE_KEY: PRIVATE_KEY, VAPID_SUBJECT: "feudo" },
    ],
  ])("refuses %s", (_label, env) => {
    expect(() => readVapidKeys(env)).toThrow(InvalidVapidConfigError);
  });

  it("never puts a key in the error", () => {
    try {
      readVapidKeys({ VAPID_PUBLIC_KEY: "leaky-public", VAPID_PRIVATE_KEY: "leaky-private" });
    } catch (error) {
      expect(String(error)).not.toMatch(/leaky/);
    }
  });
});
