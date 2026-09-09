import { beforeEach, describe, expect, it, vi } from "vitest";

const executeMock = vi.fn();

vi.mock("@/db/client", () => ({
  getDb: () => ({ execute: executeMock }),
}));

const { GET } = await import("./route");
const { resetHealthProbeCache } = await import("./probe");

describe("GET /api/health", () => {
  beforeEach(() => {
    executeMock.mockReset();
    resetHealthProbeCache();
  });

  it("returns ok when the database answers", async () => {
    executeMock.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, db: true });
  });

  it("returns 503 without leaking connection details when the database is unreachable", async () => {
    executeMock.mockRejectedValueOnce(
      new Error("connection failed: postgres://user:secret@host/db"),
    );

    const response = await GET();

    expect(response.status).toBe(503);
    const body: unknown = await response.json();
    expect(body).toEqual({ ok: false, db: false });
    expect(JSON.stringify(body)).not.toContain("postgres://");
  });

  it("memoizes the database probe instead of querying on every request", async () => {
    executeMock.mockResolvedValue({ rows: [{ "?column?": 1 }] });

    await GET();
    await GET();
    await GET();

    expect(executeMock).toHaveBeenCalledTimes(1);
  });

  it("re-probes after the cache is reset", async () => {
    executeMock.mockResolvedValue({ rows: [{ "?column?": 1 }] });

    await GET();
    resetHealthProbeCache();
    await GET();

    expect(executeMock).toHaveBeenCalledTimes(2);
  });
});
