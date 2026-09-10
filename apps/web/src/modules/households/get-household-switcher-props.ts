import { headers } from "next/headers";

import { listHouseholds, type HouseholdSummary } from "./service";

export type HouseholdSwitcherProps = {
  households: HouseholdSummary[];
  activeHouseholdId: string;
};

// Fetched once per request by AppShell and handed to both the nav and the
// mobile header slots as already-resolved props: rendering the same async
// HouseholdSwitcher element object in two tree positions used to run
// listHouseholds() twice, since React renders every occurrence of a server
// component element independently.
export async function getHouseholdSwitcherProps(
  activeHouseholdId: string,
): Promise<HouseholdSwitcherProps | null> {
  const requestHeaders = await headers();
  const households = await listHouseholds(requestHeaders);
  if (households.length === 0) {
    return null;
  }
  return { households, activeHouseholdId };
}
