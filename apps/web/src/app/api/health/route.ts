import { NextResponse } from "next/server";

import { getHealthStatus } from "./probe";

export async function GET(): Promise<NextResponse> {
  const { db, migrations } = await getHealthStatus();
  const ok = db && migrations.upToDate;
  return NextResponse.json({ ok, db, migrations }, { status: ok ? 200 : 503 });
}
