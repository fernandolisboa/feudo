import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db/client";

export async function GET(): Promise<NextResponse> {
  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, db: true });
  } catch {
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
}
