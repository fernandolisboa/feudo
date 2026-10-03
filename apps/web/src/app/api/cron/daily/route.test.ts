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
  runHouseholdPurgeStep: vi.fn(),
}));

vi.mock("@/modules/privacy", () => ({
  runAccountPurgeStep: vi.fn(),
}));

vi.mock("@/modules/sync", () => ({
  runDailyPruneStep: vi.fn(),
}));

vi.mock("@/modules/reserve", () => ({
  runReserveMonthCloseStep: vi.fn(),
}));

const { GET } = await import("./route");
const { runDailyRefreshStep } = await import("@/modules/market-data");
const { runDailyPruneStep: runAuthPruneStep } = await import("@/modules/auth");
const { runDailyPruneStep: runHouseholdsPruneStep, runHouseholdPurgeStep } =
  await import("@/modules/households");
const { runAccountPurgeStep } = await import("@/modules/privacy");
const { runDailyPruneStep: runSyncPruneStep } = await import("@/modules/sync");
const { runReserveMonthCloseStep } = await import("@/modules/reserve");

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
    vi.mocked(runAccountPurgeStep).mockResolvedValue({
      ok: true,
      purged: 0,
      failed: 0,
      unreached: 0,
    });
    vi.mocked(runHouseholdPurgeStep).mockResolvedValue({ purged: 0 });
    vi.mocked(runDailyRefreshStep).mockResolvedValue({ ok: true, results: [] });
    vi.mocked(runReserveMonthCloseStep).mockResolvedValue({
      ok: true,
      recorded: 0,
      notified: 0,
      skipped: 0,
      failed: 0,
      unreached: 0,
    });
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

  it("returns 500 with an error summary and still reports the other steps when the reserve month-close step fails", async () => {
    vi.mocked(runReserveMonthCloseStep).mockResolvedValue({ error: "Error" });

    const response = await callCronRoute();

    expect(response.status).toBe(500);
    const body = (await response.json()) as {
      ok: boolean;
      steps: {
        marketData: { ok: boolean; results: unknown[] };
        pruneVerification: { deleted: number };
        pruneInvitations: { deleted: number };
        pruneConsents: { deleted: number };
        reserveMonthClose: { error: string };
      };
    };
    expect(body.ok).toBe(false);
    expect(body.steps.reserveMonthClose).toEqual({ error: "Error" });
    expect(body.steps.pruneConsents).toEqual({ deleted: 0 });
    expect(body.steps.marketData).toEqual({ ok: true, results: [] });
  });

  it("derives the reserve month-close deadline from the route's own maxDuration, stamped at request start", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T03:00:00.000Z"));
    try {
      await callCronRoute();

      expect(runReserveMonthCloseStep).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Date),
        new Date("2026-10-01T03:00:45.000Z"),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns 500 when the reserve month-close step reports internal failures even without a top-level error", async () => {
    vi.mocked(runReserveMonthCloseStep).mockResolvedValue({
      ok: false,
      recorded: 1,
      notified: 0,
      skipped: 0,
      failed: 1,
      unreached: 0,
    });

    const response = await callCronRoute();

    expect(response.status).toBe(500);
    const body = (await response.json()) as {
      ok: boolean;
      steps: { reserveMonthClose: { ok: boolean; failed: number } };
    };
    expect(body.ok).toBe(false);
    expect(body.steps.reserveMonthClose).toEqual({
      ok: false,
      recorded: 1,
      notified: 0,
      skipped: 0,
      failed: 1,
      unreached: 0,
    });
  });

  it("returns 500 and still reports the other steps when an account purge fails", async () => {
    vi.mocked(runAccountPurgeStep).mockResolvedValue({
      ok: false,
      purged: 1,
      failed: 1,
      unreached: 0,
    });

    const response = await callCronRoute();

    expect(response.status).toBe(500);
    const body = (await response.json()) as {
      ok: boolean;
      steps: {
        purgeAccounts: { ok: boolean; failed: number };
        purgeHouseholds: { purged: number };
        marketData: { ok: boolean; results: unknown[] };
      };
    };
    expect(body.ok).toBe(false);
    expect(body.steps.purgeAccounts).toEqual({ ok: false, purged: 1, failed: 1, unreached: 0 });
    expect(body.steps.purgeHouseholds).toEqual({ purged: 0 });
    expect(body.steps.marketData).toEqual({ ok: true, results: [] });
  });

  it("returns 500 and still reports the other steps when the household purge fails", async () => {
    vi.mocked(runHouseholdPurgeStep).mockResolvedValue({ error: "Error" });

    const response = await callCronRoute();

    expect(response.status).toBe(500);
    const body = (await response.json()) as {
      ok: boolean;
      steps: { purgeHouseholds: { error: string }; reserveMonthClose: { ok: boolean } };
    };
    expect(body.ok).toBe(false);
    expect(body.steps.purgeHouseholds).toEqual({ error: "Error" });
    expect(body.steps.reserveMonthClose.ok).toBe(true);
  });

  it("bounds the account purge to its own share of the route's budget, stamped at request start", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T03:00:00.000Z"));
    try {
      await callCronRoute();

      expect(runAccountPurgeStep).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Date),
        new Date("2026-10-01T03:00:20.000Z"),
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
