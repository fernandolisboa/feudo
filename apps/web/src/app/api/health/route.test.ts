import { beforeEach, describe, expect, it, vi } from "vitest";

const executeMock = vi.fn();

vi.mock("@/platform/db/client", () => ({
  getDb: () => ({ execute: executeMock }),
}));

const { GET } = await import("./route");
const { resetHealthProbeCache } = await import("@/platform/health/probe");
const { getExpectedMigrations } = await import("@/platform/db/migrations-status");

const expected = getExpectedMigrations();

function mockUpToDateMigrations(): void {
  executeMock.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });
  executeMock.mockResolvedValueOnce({
    rows: expected.map((when) => ({ created_at: String(when) })),
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
      migrations: { status: "up-to-date" },
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
      migrations: { status: "unknown" },
    });
    expect(JSON.stringify(body)).not.toContain("postgres://");
  });

  it("returns 503 when the database answers but migrations are behind", async () => {
    executeMock.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });
    executeMock.mockResolvedValueOnce({
      rows: expected.slice(0, -1).map((when) => ({ created_at: String(when) })),
    });

    const response = await GET();

    expect(response.status).toBe(503);
    const body: unknown = await response.json();
    expect(body).toEqual({
      ok: false,
      db: true,
      migrations: { status: "behind" },
    });
  });

  it("returns 503 when the database has migrations rows absent from the journal", async () => {
    executeMock.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });
    executeMock.mockResolvedValueOnce({
      rows: [...expected, 1].map((when) => ({ created_at: String(when) })),
    });

    const response = await GET();

    expect(response.status).toBe(503);
    const body: unknown = await response.json();
    expect(body).toEqual({
      ok: false,
      db: true,
      migrations: { status: "ahead" },
    });
  });

  it("never includes applied or expected counts in the response body", async () => {
    mockUpToDateMigrations();

    const response = await GET();
    const body: unknown = await response.json();

    expect(JSON.stringify(body)).not.toMatch(/applied|expected/);
  });

  it("memoizes the database probe instead of querying on every request", async () => {
    mockUpToDateMigrations();
    executeMock.mockResolvedValue({
      rows: expected.map((when) => ({ created_at: String(when) })),
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

  it("shares a single in-flight probe across concurrent requests", async () => {
    let resolveSelectOne: (value: { rows: { "?column?": number }[] }) => void = () => undefined;
    executeMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSelectOne = resolve;
        }),
    );
    executeMock.mockResolvedValueOnce({
      rows: expected.map((when) => ({ created_at: String(when) })),
    });

    const first = GET();
    const second = GET();

    resolveSelectOne({ rows: [{ "?column?": 1 }] });

    const [firstResponse, secondResponse] = await Promise.all([first, second]);

    expect(await firstResponse.json()).toEqual(await secondResponse.json());
    expect(executeMock).toHaveBeenCalledTimes(2);
  });
});
