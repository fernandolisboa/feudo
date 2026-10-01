import { describe, expect, it } from "vitest";

import { CONNECTION_SYNC_FAILURES, parseSyncFailure } from "./sync-status";

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
