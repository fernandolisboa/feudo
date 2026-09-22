import { NextResponse } from "next/server";

import { getDb } from "@/platform/db/client";
import { isCronRequestAuthorized } from "@/platform/cron-auth";
import { runConnectionsSyncStep } from "@/modules/sync";

export const maxDuration = 60;

export async function GET(request: Request): Promise<NextResponse> {
  if (!isCronRequestAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const connections = await runConnectionsSyncStep(getDb());
  const ok = "error" in connections ? false : connections.ok;

  return NextResponse.json({ ok, steps: { connections } }, { status: ok ? 200 : 500 });
}
