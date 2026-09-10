import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db/client", () => ({
  getDb: () => ({}),
}));

vi.mock("@/lib/market-data", () => ({
  refreshMarketData: vi.fn(),
}));

vi.mock("@/modules/auth", () => ({
  pruneExpiredVerifications: vi.fn(),
}));

const { GET } = await import("./route");
const { refreshMarketData } = await import("@/lib/market-data");
const { pruneExpiredVerifications } = await import("@/modules/auth");

const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET;

async function callCronRoute(): Promise<Response> {
  return GET(
    new Request("https://example.com/api/cron/daily", {
      headers: { authorization: "Bearer test-secret" },
    }),
  );
}

describe("GET /api/cron/daily", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
    vi.mocked(pruneExpiredVerifications).mockResolvedValue(0);
    vi.mocked(refreshMarketData).mockResolvedValue({ ok: true, results: [] });
  });

  afterEach(() => {
    process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
    vi.restoreAllMocks();
  });

  it("returns 401 when no bearer token is provided", async () => {
    const response = await GET(new Request("https://example.com/api/cron/daily"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ ok: false });
  });

  it("returns 401 when the bearer token does not match", async () => {
    const response = await GET(
      new Request("https://example.com/api/cron/daily", {
        headers: { authorization: "Bearer wrong-secret" },
      }),
    );

    expect(response.status).toBe(401);
  });

  it("returns 500 with an error summary and still reports the prune step when refreshMarketData rejects", async () => {
    vi.mocked(refreshMarketData).mockRejectedValue(new Error("unexpected crash"));

    const response = await callCronRoute();

    expect(response.status).toBe(500);
    const body = (await response.json()) as {
      ok: boolean;
      steps: {
        marketData: { error: string };
        pruneVerification: { deleted: number };
      };
    };
    expect(body.ok).toBe(false);
    expect(body.steps.marketData).toEqual({ error: "Error" });
    expect(body.steps.pruneVerification).toEqual({ deleted: 0 });
  });
});
