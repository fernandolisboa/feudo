import { NextResponse } from "next/server";

import { getHealthStatus } from "@/platform/health/probe";

export async function GET(): Promise<NextResponse> {
  const { db, migrations } = await getHealthStatus();
  const ok = db && migrations.status === "up-to-date";
  return NextResponse.json({ ok, db, migrations }, { status: ok ? 200 : 503 });
}
