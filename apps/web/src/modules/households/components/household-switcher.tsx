import { headers } from "next/headers";

import { getCurrentSession } from "@/modules/auth";

import { listHouseholds } from "../service";
import { HouseholdSwitcherSelect } from "./household-switcher-select";

export async function HouseholdSwitcher() {
  const session = await getCurrentSession();
  if (!session?.householdId) {
    return null;
  }

  const requestHeaders = await headers();
  const households = await listHouseholds(requestHeaders);
  if (households.length === 0) {
    return null;
  }

  return (
    <HouseholdSwitcherSelect households={households} activeHouseholdId={session.householdId} />
  );
}
