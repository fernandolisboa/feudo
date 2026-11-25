import { eq } from "drizzle-orm";

import { bankTransaction } from "@/modules/sync/schema";

import type { Database } from "@/platform/db/client";

export async function transactionIdFor(
  db: Database,
  providerTransactionId: string,
): Promise<string> {
  const [row] = await db
    .select({ id: bankTransaction.id })
    .from(bankTransaction)
    .where(eq(bankTransaction.providerTransactionId, providerTransactionId));
  if (!row) {
    throw new Error(`seed did not create transaction ${providerTransactionId}`);
  }
  return row.id;
}
