import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/platform/db/client", () => ({
  getDb: () => ({}),
}));

vi.mock("@/modules/sync", () => ({
  runConnectionsSyncStep: vi.fn(),
}));

const { GET } = await import("./route");
const { runConnectionsSyncStep } = await import("@/modules/sync");

const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET;

async function callCronRoute(): Promise<Response> {
  return GET(
    new Request("https://example.com/api/cron/sync", {
      headers: { authorization: "Bearer test-secret" },
    }),
  );
}

describe("GET /api/cron/sync", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
    vi.mocked(runConnectionsSyncStep).mockResolvedValue({ ok: true, synced: 2, failed: 0 });
  });

  afterEach(() => {
    process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
    vi.restoreAllMocks();
  });

  it("returns 401 without touching the provider when the bearer token is missing or wrong", async () => {
    const missing = await GET(new Request("https://example.com/api/cron/sync"));
    const wrong = await GET(
      new Request("https://example.com/api/cron/sync", {
        headers: { authorization: "Bearer wrong-secret" },
      }),
    );

    expect(missing.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(runConnectionsSyncStep).not.toHaveBeenCalled();
  });

  it("reports the sync counts with 200 when the step succeeds", async () => {
    const response = await callCronRoute();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      steps: { connections: { ok: true, synced: 2, failed: 0 } },
    });
  });

  it("returns 500 when nothing could be synced or the step itself errored", async () => {
    vi.mocked(runConnectionsSyncStep).mockResolvedValueOnce({ ok: false, synced: 0, failed: 3 });
    const allFailed = await callCronRoute();
    vi.mocked(runConnectionsSyncStep).mockResolvedValueOnce({ error: "MissingSecretError" });
    const errored = await callCronRoute();

    expect(allFailed.status).toBe(500);
    expect(errored.status).toBe(500);
    await expect(errored.json()).resolves.toEqual({
      ok: false,
      steps: { connections: { error: "MissingSecretError" } },
    });
  });
});
