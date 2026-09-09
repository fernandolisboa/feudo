import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { termsAcceptances } from "@/db/schema/terms.ts";

export async function recordTermsAcceptance(
  db: Database,
  userId: string,
  version: string,
): Promise<void> {
  await db.insert(termsAcceptances).values({ userId, version });
}

export async function listTermsAcceptancesForUser(
  db: Database,
  userId: string,
): Promise<{ id: string; userId: string; version: string; acceptedAt: Date }[]> {
  return db.select().from(termsAcceptances).where(eq(termsAcceptances.userId, userId));
}
