import { and, eq, gt, sql } from "drizzle-orm";

import { invitation } from "./schema";

import type { Database } from "@/platform/db/client";

export async function hasPendingInvitation(db: Database, email: string): Promise<boolean> {
  const rows = await db
    .select({ id: invitation.id })
    .from(invitation)
    .where(
      and(
        eq(sql`lower(${invitation.email})`, email.trim().toLowerCase()),
        eq(invitation.status, "pending"),
        gt(invitation.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return rows.length > 0;
}
