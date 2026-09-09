import { NextResponse } from "next/server";

import { getDbStatus } from "./probe";

export async function GET(): Promise<NextResponse> {
  const ok = await getDbStatus();
  return ok
    ? NextResponse.json({ ok: true, db: true })
    : NextResponse.json({ ok: false, db: false }, { status: 503 });
}
