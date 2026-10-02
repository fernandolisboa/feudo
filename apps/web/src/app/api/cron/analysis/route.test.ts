import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/platform/db/client", () => ({
  getDb: () => ({}),
}));

vi.mock("@/modules/analysis", () => ({
  createAnalysisDeps: () => ({}),
  runMonthlyAnalysisStep: vi.fn(),
}));

const { GET } = await import("./route");
const { runMonthlyAnalysisStep } = await import("@/modules/analysis");

const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET;

async function callCronRoute(): Promise<Response> {
  return GET(
    new Request("https://example.com/api/cron/analysis", {
      headers: { authorization: "Bearer test-secret" },
    }),
  );
}

const RESULT = { ok: true, disabled: false, succeeded: 1, failed: 0, skipped: 2, unreached: 0 };

describe("GET /api/cron/analysis", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
    vi.mocked(runMonthlyAnalysisStep).mockResolvedValue(RESULT);
  });

  afterEach(() => {
    process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
    vi.mocked(runMonthlyAnalysisStep).mockReset();
  });

  it("returns 401 without calling the model when the bearer token is missing or wrong", async () => {
    const missing = await GET(new Request("https://example.com/api/cron/analysis"));
    const wrong = await GET(
      new Request("https://example.com/api/cron/analysis", {
        headers: { authorization: "Bearer wrong-secret" },
      }),
    );

    expect(missing.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(runMonthlyAnalysisStep).not.toHaveBeenCalled();
  });

  it("runs the monthly step within the route's own time limit", async () => {
    const before = Date.now();
    const response = await callCronRoute();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, steps: { monthlyAnalysis: RESULT } });
    const options = vi.mocked(runMonthlyAnalysisStep).mock.calls[0]?.[2];
    expect(options?.deadline.getTime()).toBeLessThanOrEqual(before + 300_000);
    expect(options?.deadline.getTime()).toBeGreaterThan(before + 200_000);
  });

  it("answers 500 when a household failed or the step errored", async () => {
    vi.mocked(runMonthlyAnalysisStep).mockResolvedValueOnce({ ...RESULT, ok: false, failed: 1 });
    expect((await callCronRoute()).status).toBe(500);

    vi.mocked(runMonthlyAnalysisStep).mockResolvedValueOnce({ error: "Error" });
    expect((await callCronRoute()).status).toBe(500);
  });
});
