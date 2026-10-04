import { describe, expect, it } from "vitest";

import { CONNECTION_SYNC_FAILURES, parseSyncFailure, reachedRepeatedFailure } from "./sync-status";

describe("parseSyncFailure", () => {
  it("reads no failure from a connection whose last sync succeeded", () => {
    expect(parseSyncFailure(null)).toBeNull();
  });

  it.each(CONNECTION_SYNC_FAILURES)("keeps the recorded cause %s", (failure) => {
    expect(parseSyncFailure(failure)).toBe(failure);
  });

  it("reads a value it does not know as a failure without a specific cause", () => {
    expect(parseSyncFailure("ProviderUnavailableError")).toBe("failed");
    expect(parseSyncFailure("")).toBe("failed");
  });
});

describe("reachedRepeatedFailure", () => {
  it("is reached exactly on the third failure in a row", () => {
    expect([1, 2, 3, 4].map((count) => reachedRepeatedFailure(count, "failed"))).toEqual([
      false,
      false,
      true,
      false,
    ]);
  });

  it("is never reached for credentials the person removed", () => {
    expect(reachedRepeatedFailure(3, "no_credentials")).toBe(false);
  });
});
