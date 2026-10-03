import { eq } from "drizzle-orm";

import { session as sessionTable } from "./schema";

import type { DatabaseOrTransaction } from "@/platform/db/client";

export async function revokeUserSessions(db: DatabaseOrTransaction, userId: string): Promise<void> {
  await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
}
