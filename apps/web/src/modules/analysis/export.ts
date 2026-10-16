import { eq } from "drizzle-orm";

import type { CurrentSession } from "@/modules/auth";

import { getDb } from "@/platform/db/client";
import { householdAiSettings } from "./schema";

// The LGPD export's own reader (#25): only households whose key or model
// families the session's user last changed, never every household's
// settings and never the key itself (apiKeyCiphertext is read here only to
// derive hasKey, and never returned).
export async function getAiSettingsForExport(session: CurrentSession) {
  const rows = await getDb()
    .select({
      householdId: householdAiSettings.householdId,
      monthlyFamily: householdAiSettings.monthlyFamily,
      onDemandFamily: householdAiSettings.onDemandFamily,
      apiKeyCiphertext: householdAiSettings.apiKeyCiphertext,
      updatedAt: householdAiSettings.updatedAt,
    })
    .from(householdAiSettings)
    .where(eq(householdAiSettings.updatedByUserId, session.userId));
  return rows.map((row) => ({
    householdId: row.householdId,
    monthlyFamily: row.monthlyFamily,
    onDemandFamily: row.onDemandFamily,
    hasKey: row.apiKeyCiphertext !== null,
    updatedAt: row.updatedAt,
  }));
}

export type AiSettingsExportRow = Awaited<ReturnType<typeof getAiSettingsForExport>>[number];
