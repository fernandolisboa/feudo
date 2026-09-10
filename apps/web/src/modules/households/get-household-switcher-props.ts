import { headers } from "next/headers";

import { listHouseholds, type HouseholdSummary } from "./service";

export type HouseholdSwitcherProps = {
  households: HouseholdSummary[];
  activeHouseholdId: string;
};

// Fetched once per request by (app)/layout.tsx and handed to AppShell as an
// already-resolved element, which then hands that same element to both the
// nav and the mobile header slots: passing the async HouseholdSwitcher
// component itself to both slots instead used to run listHouseholds() twice,
// since React renders every occurrence of a server component element
// independently.
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
