import { interpolateAll } from "@/lib/interpolate";

import { describeMonths } from "./describe-months";
import type { AccountDeletionHousehold } from "./service";
import { t } from "./strings";

export type DeleteAccountHouseholdSummary = { name: string; lines: string[] };

export function summarizeHouseholdForDeletion(
  household: AccountDeletionHousehold,
): DeleteAccountHouseholdSummary {
  const copy = t.deleteAccount.household;
  if (household.alreadyPendingDeletion) {
    return {
      name: household.householdName,
      lines: [interpolateAll(copy.alreadyPending, { household: household.householdName })],
    };
  }
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
