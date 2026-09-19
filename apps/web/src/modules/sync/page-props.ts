import { getDb } from "@/platform/db/client";
import type { HouseholdSession } from "@/modules/households";
import { DEFAULT_TIME_ZONE, getHouseholdSettings, householdScope } from "@/modules/households";

import {
  createHouseholdAccountsRepository,
  createSyncUserRepository,
  type ConnectionSummary,
  type HouseholdAccount,
} from "./repository";
import { userScope } from "./scope";

// Only BRL accounts ever enter a household total (#12); the split is made
// here, once, so no component decides which currency counts.
const HOUSEHOLD_CURRENCY = "BRL";

export type AccountsSectionProps = {
  domesticAccounts: HouseholdAccount[];
  foreignAccounts: HouseholdAccount[];
  connections: ConnectionSummary[];
  hasCredentials: boolean;
  credentialsSavedAt: Date | null;
  viewerUserId: string;
  timeZone: string;
};

// Everything the "Contas" section of the overview renders, so the page stays
// a composition of this slice's components (ADR-0011).
export async function getAccountsSectionProps(
  session: HouseholdSession,
): Promise<AccountsSectionProps> {
  const db = getDb();
  const userRepository = createSyncUserRepository(userScope(session));
  const [accounts, connections, credential, settings] = await Promise.all([
    createHouseholdAccountsRepository(householdScope(session), userScope(session)).list(db),
    userRepository.listConnections(db),
    userRepository.getCredential(db),
    getHouseholdSettings(householdScope(session), db),
  ]);

  return {
    domesticAccounts: accounts.filter((account) => account.currency === HOUSEHOLD_CURRENCY),
    foreignAccounts: accounts.filter((account) => account.currency !== HOUSEHOLD_CURRENCY),
    connections,
    hasCredentials: credential !== undefined,
    credentialsSavedAt: credential?.lastValidatedAt ?? null,
    viewerUserId: session.userId,
    timeZone: settings?.timeZone ?? DEFAULT_TIME_ZONE,
  };
}
