import { NextResponse } from "next/server";

import { getDb } from "@/platform/db/client";
import { isCronRequestAuthorized } from "@/platform/cron-auth";
import { createAnalysisDeps, runMonthlyAnalysisStep } from "@/modules/analysis";

// Each household's deep analysis is one long model call, so this job gets
// its own function and the longest budget instead of sharing /api/cron/daily.
export const maxDuration = 300;

// What the in-flight household's row update and this route's JSON response
// need back once the last model call returns.
const RUN_HEADROOM_MS = 15_000;

export async function GET(request: Request): Promise<NextResponse> {
  if (!isCronRequestAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const requestStartedAt = Date.now();
  const monthlyAnalysis = await runMonthlyAnalysisStep(getDb(), createAnalysisDeps(), {
    now: new Date(),
    deadline: new Date(requestStartedAt + maxDuration * 1000 - RUN_HEADROOM_MS),
  });
  const ok = "error" in monthlyAnalysis ? false : monthlyAnalysis.ok;

  return NextResponse.json({ ok, steps: { monthlyAnalysis } }, { status: ok ? 200 : 500 });
}
