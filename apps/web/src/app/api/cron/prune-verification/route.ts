import { NextResponse } from "next/server";
import { lt } from "drizzle-orm";

import { getDb } from "@/db/client";
import { verification } from "@/db/schema/auth";
import { isCronRequestAuthorized } from "@/lib/cron-auth";

export async function GET(request: Request): Promise<NextResponse> {
  if (!isCronRequestAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const deleted = await getDb()
    .delete(verification)
    .where(lt(verification.expiresAt, new Date()))
    .returning({ id: verification.id });

  return NextResponse.json({ ok: true, deleted: deleted.length });
}
