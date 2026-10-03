import { deletionPurgeAt } from "@feudo/core";

import { getDb } from "@/platform/db/client";
import { formatShortDate } from "@/lib/format-date";
import { interpolateAll } from "@/lib/interpolate";
import { getCurrentSession, getPendingAccountDeletion, type CurrentSession } from "@/modules/auth";
import { DEFAULT_TIME_ZONE, getHouseholdSettings, householdScope } from "@/modules/households";

import { describeMonths } from "./describe-months";
import { previewAccountDeletion, type AccountDeletionHousehold } from "./service";
import { t } from "./strings";

export async function timeZoneFor(session: CurrentSession): Promise<string> {
  if (!session.householdId) {
    return DEFAULT_TIME_ZONE;
  }
  const settings = await getHouseholdSettings(householdScope(session), getDb());
  return settings?.timeZone ?? DEFAULT_TIME_ZONE;
}

export type DeleteAccountHouseholdSummary = { name: string; lines: string[] };

export type DeleteAccountSectionProps = {
  restorableUntil: string;
  households: DeleteAccountHouseholdSummary[];
  othersAreTold: boolean;
};

function summarize(household: AccountDeletionHousehold): DeleteAccountHouseholdSummary {
  const copy = t.deleteAccount.household;
  const loss =
    household.accounts === 0
      ? copy.losesNothing
      : household.months.length === 0
        ? copy.losesAccountsOnly
        : copy.losesMonths;
  const lines = [
    interpolateAll(loss, {
      household: household.householdName,
      months: describeMonths(household.months),
    }),
  ];
  if (household.deletesHousehold) {
    lines.push(copy.deleted);
  } else if (household.successorName) {
    lines.push(interpolateAll(copy.successor, { name: household.successorName }));
  }
  return { name: household.householdName, lines };
}

export async function getDeleteAccountSectionProps(
  session: CurrentSession,
): Promise<DeleteAccountSectionProps> {
  const [households, timeZone] = await Promise.all([
    previewAccountDeletion(session, getDb()),
    timeZoneFor(session),
  ]);
  return {
    restorableUntil: formatShortDate(deletionPurgeAt(new Date()), timeZone),
    households: households.map(summarize),
    othersAreTold: households.some((household) => household.otherMembers.length > 0),
  };
}

export type AccountDeletionPendingPage =
  | { status: "redirect"; to: string }
  | { status: "pending"; purgeDate: string }
  | { status: "signed_out" };

// The cancel page serves both a user signed in only to cancel and someone
// who was just signed out by their own request; anyone else has no business
// there.
export async function getAccountDeletionPendingPage(): Promise<AccountDeletionPendingPage> {
  const pending = await getPendingAccountDeletion();
  if (pending) {
    return {
      status: "pending",
      purgeDate: formatShortDate(deletionPurgeAt(pending.deletionRequestedAt), DEFAULT_TIME_ZONE),
    };
  }
  if (await getCurrentSession()) {
    return { status: "redirect", to: "/" };
  }
  return { status: "signed_out" };
}
