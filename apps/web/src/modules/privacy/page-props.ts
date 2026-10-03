import { deletionPurgeAt } from "@feudo/core";

import { getDb } from "@/platform/db/client";
import { formatShortDate } from "@/lib/format-date";
import { getCurrentSession, getPendingAccountDeletion, type CurrentSession } from "@/modules/auth";
import { timeZoneForDepartingUser } from "@/modules/households";

import { previewAccountDeletion } from "./service";
import {
  summarizeHouseholdForDeletion,
  type DeleteAccountHouseholdSummary,
} from "./summarize-household";

export type DeleteAccountSectionProps = {
  restorableUntil: string;
  households: DeleteAccountHouseholdSummary[];
  othersAreTold: boolean;
};

export async function getDeleteAccountSectionProps(
  session: CurrentSession,
): Promise<DeleteAccountSectionProps> {
  const [households, timeZone] = await Promise.all([
    previewAccountDeletion(session, getDb()),
    timeZoneForDepartingUser(getDb(), session.userId),
  ]);
  return {
    restorableUntil: formatShortDate(deletionPurgeAt(new Date()), timeZone),
    households: households.map(summarizeHouseholdForDeletion),
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
      purgeDate: formatShortDate(
        deletionPurgeAt(pending.deletionRequestedAt),
        await timeZoneForDepartingUser(getDb(), pending.userId),
      ),
    };
  }
  if (await getCurrentSession()) {
    return { status: "redirect", to: "/" };
  }
  return { status: "signed_out" };
}
