import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ENDPOINT = "https://fcm.googleapis.com/fcm/send/secret-device";

const failingQuery = vi.hoisted(
  () => () =>
    Promise.reject(
      Object.assign(new Error(`Failed query: insert\nparams: user-a,${ENDPOINT}`), {
        name: "DrizzleQueryError",
      }),
    ),
);

vi.mock("@/modules/auth", () => ({
  getCurrentSession: () => Promise.resolve({ userId: "user-a" }),
}));
vi.mock("@/platform/db/client", () => ({ getDb: () => ({}) }));
vi.mock("./repository", () => ({
  createPushSubscriptionRepository: () => ({ save: failingQuery, remove: failingQuery }),
}));

import { removePushSubscription, savePushSubscription } from "./service";
import { fakeSubscriptionInput } from "./test/fake-push-sender";

const warn = vi.fn<(message: string) => void>();

beforeEach(() => {
  vi.stubEnv("VAPID_PUBLIC_KEY", `B${"x".repeat(86)}`);
  vi.stubEnv("VAPID_PRIVATE_KEY", "y".repeat(43));
  warn.mockReset();
  vi.spyOn(console, "warn").mockImplementation(warn);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("a database failure while turning notifications on or off", () => {
  it("comes back as failed and logs only the error's name, never the endpoint", async () => {
    expect(await savePushSubscription({ ...fakeSubscriptionInput(), endpoint: ENDPOINT })).toEqual({
      status: "failed",
    });
    expect(await removePushSubscription(ENDPOINT)).toEqual({ status: "failed" });

    const logged = warn.mock.calls.map(([message]) => message).join("\n");
    expect(logged).toContain("DrizzleQueryError");
    expect(logged).not.toContain("secret-device");
    expect(logged).not.toContain("user-a");
  });
});
