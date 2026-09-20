import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/platform/db/client", () => ({
  getDb: () => ({}),
}));

vi.mock("@/modules/market-data", () => ({
  runDailyRefreshStep: vi.fn(),
}));

vi.mock("@/modules/auth", () => ({
  runDailyPruneStep: vi.fn(),
}));

vi.mock("@/modules/households", () => ({
  runDailyPruneStep: vi.fn(),
}));

vi.mock("@/modules/sync", () => ({
  runDailyPruneStep: vi.fn(),
}));

const { GET } = await import("./route");
const { runDailyRefreshStep } = await import("@/modules/market-data");
const { runDailyPruneStep: runAuthPruneStep } = await import("@/modules/auth");
const { runDailyPruneStep: runHouseholdsPruneStep } = await import("@/modules/households");
const { runDailyPruneStep: runSyncPruneStep } = await import("@/modules/sync");

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
    vi.mocked(runAuthPruneStep).mockResolvedValue({ deleted: 0 });
    vi.mocked(runHouseholdsPruneStep).mockResolvedValue({ deleted: 0 });
    vi.mocked(runSyncPruneStep).mockResolvedValue({ deleted: 0 });
    vi.mocked(runDailyRefreshStep).mockResolvedValue({ ok: true, results: [] });
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

  it("returns 500 with an error summary and still reports the prune steps when the market-data step fails", async () => {
    vi.mocked(runDailyRefreshStep).mockResolvedValue({ error: "Error" });

    const response = await callCronRoute();

    expect(response.status).toBe(500);
    const body = (await response.json()) as {
      ok: boolean;
      steps: {
        marketData: { error: string };
        pruneVerification: { deleted: number };
        pruneInvitations: { deleted: number };
      };
    };
    expect(body.ok).toBe(false);
    expect(body.steps.marketData).toEqual({ error: "Error" });
    expect(body.steps.pruneVerification).toEqual({ deleted: 0 });
    expect(body.steps.pruneInvitations).toEqual({ deleted: 0 });
  });

  it("returns 500 with an error summary and still reports the other steps when the auth prune step fails", async () => {
    vi.mocked(runAuthPruneStep).mockResolvedValue({ error: "Error" });

    const response = await callCronRoute();

    expect(response.status).toBe(500);
    const body = (await response.json()) as {
      ok: boolean;
      steps: {
        marketData: { ok: boolean; results: unknown[] };
        pruneVerification: { error: string };
        pruneInvitations: { deleted: number };
      };
    };
    expect(body.ok).toBe(false);
    expect(body.steps.pruneVerification).toEqual({ error: "Error" });
    expect(body.steps.pruneInvitations).toEqual({ deleted: 0 });
    expect(body.steps.marketData).toEqual({ ok: true, results: [] });
  });

  it("returns 500 with an error summary and still reports the other steps when the households prune step fails", async () => {
    vi.mocked(runHouseholdsPruneStep).mockResolvedValue({ error: "Error" });

    const response = await callCronRoute();

    expect(response.status).toBe(500);
    const body = (await response.json()) as {
      ok: boolean;
      steps: {
        marketData: { ok: boolean; results: unknown[] };
        pruneVerification: { deleted: number };
        pruneInvitations: { error: string };
      };
    };
    expect(body.ok).toBe(false);
    expect(body.steps.pruneInvitations).toEqual({ error: "Error" });
    expect(body.steps.pruneVerification).toEqual({ deleted: 0 });
    expect(body.steps.marketData).toEqual({ ok: true, results: [] });
  });

  it("returns 500 with an error summary and still reports the other steps when the consent prune step fails", async () => {
    vi.mocked(runSyncPruneStep).mockResolvedValue({ error: "Error" });

    const response = await callCronRoute();

    expect(response.status).toBe(500);
    const body = (await response.json()) as {
      ok: boolean;
      steps: {
        marketData: { ok: boolean; results: unknown[] };
        pruneVerification: { deleted: number };
        pruneInvitations: { deleted: number };
        pruneConsents: { error: string };
      };
    };
    expect(body.ok).toBe(false);
    expect(body.steps.pruneConsents).toEqual({ error: "Error" });
    expect(body.steps.pruneInvitations).toEqual({ deleted: 0 });
    expect(body.steps.marketData).toEqual({ ok: true, results: [] });
  });
});
