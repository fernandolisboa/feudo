import { formatYearMonth, type YearMonth } from "@feudo/core";

import { interpolateAll } from "@/lib/interpolate";
import type { PushPayload } from "@/lib/push-payload";

import { t } from "./strings";

export type HouseholdEvent =
  | { kind: "reserve_target_moved"; closedMonth: YearMonth }
  | { kind: "monthly_analysis_ready"; month: YearMonth };

export type UserEvent = { kind: "sync_failing"; connectionId: string; institutionName: string };

// Says what happened and where to look, never an amount (ADR-0012). The tag
// makes a repeat of the same event replace the earlier notification instead
// of stacking.
export function householdEventPayload(
  event: HouseholdEvent,
  householdId: string,
  householdName: string,
): PushPayload {
  switch (event.kind) {
    case "reserve_target_moved":
      return {
        title: t.messages.reserveTargetMoved.title,
        body: interpolateAll(t.messages.reserveTargetMoved.body, { household: householdName }),
        url: "/reserva",
        tag: `reserve-target:${householdId}:${event.closedMonth}`,
      };
    case "monthly_analysis_ready":
      return {
        title: t.messages.monthlyAnalysisReady.title,
        body: interpolateAll(t.messages.monthlyAnalysisReady.body, {
          household: householdName,
          month: formatYearMonth(event.month),
        }),
        url: "/",
        tag: `monthly-analysis:${householdId}:${event.month}`,
      };
  }
}

export function userEventPayload(event: UserEvent): PushPayload {
  return {
    title: t.messages.syncFailing.title,
    body: interpolateAll(t.messages.syncFailing.body, { bank: event.institutionName }),
    url: "/",
    tag: `sync-failing:${event.connectionId}`,
  };
}
