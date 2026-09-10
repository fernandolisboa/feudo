import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const executeMock = vi.fn();

vi.mock("@/db/client", () => ({
  getDb: () => ({ execute: executeMock }),
}));

const { getHealthStatus, resetHealthProbeCache } = await import("./probe");

describe("getHealthStatus", () => {
  beforeEach(() => {
    executeMock.mockReset();
    resetHealthProbeCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves to an unknown, unhealthy probe when the underlying queries hang past the deadline", async () => {
    executeMock.mockImplementation(() => new Promise(() => undefined));

    const resultPromise = getHealthStatus();
    await vi.advanceTimersByTimeAsync(5_000);
    const result = await resultPromise;

    expect(result).toEqual({ db: false, migrations: { status: "unknown" } });
  });

  it("does not leave a dangling timer once the probe settles before the deadline", async () => {
    executeMock.mockResolvedValue({ rows: [] });

    await getHealthStatus();

    expect(vi.getTimerCount()).toBe(0);
  });
});
