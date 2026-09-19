import { getDb } from "@/platform/db/client";
import type { HouseholdSession } from "@/modules/households";
import { getHouseholdSettings, householdScope } from "@/modules/households";

import {
  createHouseholdAccountsRepository,
  createSyncUserRepository,
  type ConnectionSummary,
  type HouseholdAccount,
} from "./repository";
import { userScope } from "./scope";

const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

export type AccountsSectionProps = {
  accounts: HouseholdAccount[];
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
    createHouseholdAccountsRepository(householdScope(session)).list(db),
    userRepository.listConnections(db),
    userRepository.getCredential(db),
    getHouseholdSettings(householdScope(session), db),
  ]);

  return {
    accounts,
    connections,
    hasCredentials: credential !== undefined,
    credentialsSavedAt: credential?.lastValidatedAt ?? null,
    viewerUserId: session.userId,
    timeZone: settings?.timeZone ?? DEFAULT_TIME_ZONE,
  };
}
