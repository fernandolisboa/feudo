import { beforeEach, describe, expect, it, vi } from "vitest";

const executeMock = vi.fn();

vi.mock("@/db/client", () => ({
  getDb: () => ({ execute: executeMock }),
}));

const { GET } = await import("./route");
const { resetHealthProbeCache } = await import("./probe");
const { getExpectedMigrations } = await import("@/db/migrations-status");

const expected = getExpectedMigrations();

function mockUpToDateMigrations(): void {
  executeMock.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });
  executeMock.mockResolvedValueOnce({
    rows: [{ count: expected.count, latestCreatedAt: String(expected.latestWhen) }],
  });
}

describe("GET /api/health", () => {
  beforeEach(() => {
    executeMock.mockReset();
    resetHealthProbeCache();
  });

  it("returns ok when the database answers and migrations are up to date", async () => {
    mockUpToDateMigrations();

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      db: true,
      migrations: { applied: expected.count, expected: expected.count, upToDate: true },
    });
  });

  it("returns 503 without leaking connection details when the database is unreachable", async () => {
    executeMock.mockRejectedValue(new Error("connection failed: postgres://user:secret@host/db"));

    const response = await GET();

    expect(response.status).toBe(503);
    const body: unknown = await response.json();
    expect(body).toEqual({
      ok: false,
      db: false,
      migrations: { applied: 0, expected: expected.count, upToDate: false },
    });
    expect(JSON.stringify(body)).not.toContain("postgres://");
  });

  it("returns 503 when the database answers but migrations are behind", async () => {
    executeMock.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });
    executeMock.mockResolvedValueOnce({
      rows: [{ count: expected.count - 1, latestCreatedAt: null }],
    });

    const response = await GET();

    expect(response.status).toBe(503);
    const body: unknown = await response.json();
    expect(body).toEqual({
      ok: false,
      db: true,
      migrations: { applied: expected.count - 1, expected: expected.count, upToDate: false },
    });
  });

  it("memoizes the database probe instead of querying on every request", async () => {
    mockUpToDateMigrations();
    executeMock.mockResolvedValue({
      rows: [{ count: expected.count, latestCreatedAt: String(expected.latestWhen) }],
    });

    await GET();
    await GET();
    await GET();

    expect(executeMock).toHaveBeenCalledTimes(2);
  });

  it("re-probes after the cache is reset", async () => {
    mockUpToDateMigrations();
    mockUpToDateMigrations();

    await GET();
    resetHealthProbeCache();
    await GET();

    expect(executeMock).toHaveBeenCalledTimes(4);
  });
});
