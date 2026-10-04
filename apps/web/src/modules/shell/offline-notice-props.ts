import { getDb } from "@/platform/db/client";
import {
  DEFAULT_TIME_ZONE,
  getHouseholdSettings,
  householdScope,
  type HouseholdSession,
} from "@/modules/households";

export type OfflineNoticeProps = {
  renderedAt: string;
  timeZone: string;
  scope: string;
};

// The render time travels inside the page, so a copy served offline still
// says when its data was read; the scope tells the browser whose copies it
// is holding (ADR-0007).
export async function getOfflineNoticeProps(
  session: HouseholdSession,
  now: Date,
): Promise<OfflineNoticeProps> {
  const settings = await getHouseholdSettings(householdScope(session), getDb());
  return {
    renderedAt: now.toISOString(),
    timeZone: settings?.timeZone ?? DEFAULT_TIME_ZONE,
    scope: `${session.userId}:${session.householdId}`,
  };
}
