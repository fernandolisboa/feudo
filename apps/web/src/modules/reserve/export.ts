import { eq } from "drizzle-orm";

import type { CurrentSession } from "@/modules/auth";

import { getDb } from "@/platform/db/client";
import { reserveMark } from "./schema";

// The LGPD export's own reader (#25): only the reserve marks the session's
// user last updated. updated_by_user_id itself stays out of the row (every
// row returned is already theirs), the same shape ledger's export reader
// uses for its own authored-by columns.
export async function getReserveMarksForExport(session: CurrentSession) {
  return getDb()
    .select({
      householdId: reserveMark.householdId,
      accountId: reserveMark.accountId,
      isReserve: reserveMark.isReserve,
      liquidity: reserveMark.liquidity,
      institutionId: reserveMark.institutionId,
      updatedAt: reserveMark.updatedAt,
    })
    .from(reserveMark)
    .where(eq(reserveMark.updatedByUserId, session.userId));
}

export type ReserveMarkExportRow = Awaited<ReturnType<typeof getReserveMarksForExport>>[number];
