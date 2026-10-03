import {
  DEFAULT_TIME_ZONE,
  getHouseholdSettings,
  householdScope,
  type HouseholdSession,
} from "@/modules/households";

import { formatShortDateTime } from "@/lib/format-date";
import { getDb } from "@/platform/db/client";
import { financialDataKindLabel } from "./labels";
import { listRecentFinancialDataAccess } from "./service";

export type RecentAccessRowView = { id: string; kindLabel: string; whenLabel: string };

// Everything the Casa page's "Seus acessos recentes" section renders, so the
// page stays a composition of this slice's own view, never reaching into
// repository.ts or service.ts directly (ADR-0011).
export async function getRecentAccessPageProps(
  session: HouseholdSession,
): Promise<RecentAccessRowView[]> {
  const db = getDb();
  const [settings, entries] = await Promise.all([
    getHouseholdSettings(householdScope(session), db),
    listRecentFinancialDataAccess(session),
  ]);
  const timeZone = settings?.timeZone ?? DEFAULT_TIME_ZONE;

  return entries.map((entry) => ({
    id: entry.id,
    kindLabel: financialDataKindLabel(entry.kind),
    whenLabel: formatShortDateTime(entry.accessedAt, timeZone),
  }));
}
