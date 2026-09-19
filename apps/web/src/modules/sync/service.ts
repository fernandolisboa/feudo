import { z } from "zod";

import type { CurrentSession } from "@/modules/auth";
import type { HouseholdSession } from "@/modules/households";
import { householdScope } from "@/modules/households";

import type { Outcome, SimpleOutcome } from "@/lib/outcome";
import type { Database } from "@/platform/db/client";
import { CONSENT_MAX_AGE_MS, CONSENT_SCOPE_VERSION, currentConsentScopeText } from "./consent-text";
import { decryptSecret, encryptSecret } from "./crypto";
import { readEncryptionKey, type SyncEnv } from "./env";
import type { DataProvider, ProviderClient, ProviderCredentials } from "./provider/provider";
import { ProviderResponseShapeError, ProviderUnavailableError } from "./provider/provider";
import { getDataProvider } from "./provider/select";
import {
  createHouseholdAccountsRepository,
  createSyncUserRepository,
  type DataProviderKind,
  type SyncUserRepository,
} from "./repository";
import { userScope } from "./scope";
import type {
  AddConnectionFormInput,
  ConnectProviderFormInput,
  RelabelAccountFormInput,
} from "./validation";

export type SyncDeps = {
  provider: DataProvider;
  encryptionKey: string;
};

// Throws MissingSecretError / InvalidDataProviderError when the environment
// is incomplete: the actions map those to one "misconfigured" message.
export function createSyncDeps(env: SyncEnv = process.env): SyncDeps {
  return { provider: getDataProvider(env), encryptionKey: readEncryptionKey(env) };
}

const PROVIDER_KIND: DataProviderKind = "pluggy";

const storedCredentialsSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
});

function serializeCredentials(credentials: ProviderCredentials, encryptionKey: string): string {
  return encryptSecret(JSON.stringify(credentials), encryptionKey);
}

function deserializeCredentials(ciphertext: string, encryptionKey: string): ProviderCredentials {
  return storedCredentialsSchema.parse(JSON.parse(decryptSecret(ciphertext, encryptionKey)));
}

function isProviderFailure(error: unknown): boolean {
  return error instanceof ProviderUnavailableError || error instanceof ProviderResponseShapeError;
}

export type AcceptConsentOutcome = Outcome<{ consentId: string }, "failed">;

export async function acceptConsent(
  session: CurrentSession,
  db: Database,
): Promise<AcceptConsentOutcome> {
  try {
    const consentId = await createSyncUserRepository(userScope(session)).createConsent(db, {
      scopeVersion: CONSENT_SCOPE_VERSION,
      scopeText: currentConsentScopeText(),
    });
    return { status: "ok", consentId };
  } catch {
    return { status: "failed" };
  }
}

async function findUsableConsent(
  repository: SyncUserRepository,
  db: Database,
  consentId: string,
): Promise<boolean> {
  const consent = await repository.findConsent(db, consentId);
  if (!consent) {
    return false;
  }
  return Date.now() - consent.acceptedAt.getTime() <= CONSENT_MAX_AGE_MS;
}

type ConnectionFailure = "item_not_found" | "already_connected" | "provider_unavailable" | "failed";

type EstablishedConnection = { connectionId: string; accountsCount: number };

// Every provider read happens before the first write, so a provider that
// answers the credential check but fails on the listing leaves nothing
// behind: no half-synced connection to explain.
async function establishConnection(
  client: ProviderClient,
  repository: SyncUserRepository,
  db: Database,
  input: { providerItemId: string; consentId: string; householdId: string },
): Promise<Outcome<EstablishedConnection, ConnectionFailure>> {
  const existing = await repository.findConnectionByItem(db, PROVIDER_KIND, input.providerItemId);
  if (existing) {
    return { status: "already_connected" };
  }

  let described;
  let accounts;
  try {
    described = await client.describeConnection(input.providerItemId);
    if (described.status === "not_found") {
      return { status: "item_not_found" };
    }
    accounts = [
      ...(await client.listAccounts(input.providerItemId)),
      ...(await client.listInvestmentPositions(input.providerItemId)),
    ];
  } catch (error) {
    if (isProviderFailure(error)) {
      return { status: "provider_unavailable" };
    }
    throw error;
  }

  const syncedAt = new Date();
  try {
    const connectionId = await repository.createConnection(db, {
      provider: PROVIDER_KIND,
      providerItemId: input.providerItemId,
      institutionName: described.connection.institutionName,
      institutionProviderId: described.connection.institutionProviderId,
      consentId: input.consentId,
    });
    await repository.upsertAccounts(db, connectionId, accounts, {
      householdIdForNew: input.householdId,
      syncedAt,
    });
    await repository.markSynced(db, connectionId, { syncedAt, error: null });
    return { status: "ok", connectionId, accountsCount: accounts.length };
  } catch {
    return { status: "failed" };
  }
}

export type ConnectProviderOutcome = Outcome<
  EstablishedConnection,
  "consent_required" | "invalid_credentials" | ConnectionFailure
>;

// The wizard's last step: validate the pasted credentials against the
// provider, store them encrypted, then create and sync the first connection.
// The credentials are saved even if the item lookup fails afterwards: they
// were proven valid, and the next attempt only needs the item id.
export async function connectProvider(
  input: ConnectProviderFormInput,
  session: HouseholdSession,
  db: Database,
  deps: SyncDeps,
): Promise<ConnectProviderOutcome> {
  const repository = createSyncUserRepository(userScope(session));
  if (!(await findUsableConsent(repository, db, input.consentId))) {
    return { status: "consent_required" };
  }

  const credentials: ProviderCredentials = {
    clientId: input.clientId,
    clientSecret: input.clientSecret,
  };
  let authenticated;
  try {
    authenticated = await deps.provider.authenticate(credentials);
  } catch (error) {
    if (isProviderFailure(error)) {
      return { status: "provider_unavailable" };
    }
    throw error;
  }
  if (authenticated.status === "invalid_credentials") {
    return { status: "invalid_credentials" };
  }

  try {
    await repository.saveCredential(db, {
      provider: PROVIDER_KIND,
      ciphertext: serializeCredentials(credentials, deps.encryptionKey),
      validatedAt: new Date(),
    });
  } catch {
    return { status: "failed" };
  }

  return establishConnection(authenticated.client, repository, db, {
    providerItemId: input.providerItemId,
    consentId: input.consentId,
    householdId: session.householdId,
  });
}

export type AddConnectionOutcome = Outcome<
  EstablishedConnection,
  "no_credentials" | "invalid_credentials" | ConnectionFailure
>;

// Adds another item under the stored credentials. A fresh consent row is
// recorded for it: consent is per connection (ADR-0008), and the dialog
// repeats the checkbox rather than reusing one accepted for another bank.
export async function addConnection(
  input: AddConnectionFormInput,
  session: HouseholdSession,
  db: Database,
  deps: SyncDeps,
): Promise<AddConnectionOutcome> {
  const repository = createSyncUserRepository(userScope(session));
  const stored = await repository.getCredential(db);
  if (!stored) {
    return { status: "no_credentials" };
  }

  let authenticated;
  try {
    authenticated = await deps.provider.authenticate(
      deserializeCredentials(stored.ciphertext, deps.encryptionKey),
    );
  } catch (error) {
    if (isProviderFailure(error)) {
      return { status: "provider_unavailable" };
    }
    throw error;
  }
  if (authenticated.status === "invalid_credentials") {
    return { status: "invalid_credentials" };
  }

  const consent = await acceptConsent(session, db);
  if (consent.status !== "ok") {
    return { status: "failed" };
  }

  return establishConnection(authenticated.client, repository, db, {
    providerItemId: input.providerItemId,
    consentId: consent.consentId,
    householdId: session.householdId,
  });
}

export type RemoveCredentialsOutcome = SimpleOutcome<"ok" | "not_found" | "failed">;

// Destroys the credential row and nothing else: connections and their
// accounts stay until deleted, sync merely has nothing to authenticate with.
export async function removeCredentials(
  session: CurrentSession,
  db: Database,
): Promise<RemoveCredentialsOutcome> {
  try {
    const deleted = await createSyncUserRepository(userScope(session)).deleteCredential(db);
    return { status: deleted ? "ok" : "not_found" };
  } catch {
    return { status: "failed" };
  }
}

export type DeleteConnectionOutcome = SimpleOutcome<"ok" | "not_found" | "failed">;

export async function deleteConnection(
  connectionId: string,
  session: CurrentSession,
  db: Database,
): Promise<DeleteConnectionOutcome> {
  try {
    const deleted = await createSyncUserRepository(userScope(session)).deleteConnection(
      db,
      connectionId,
    );
    return { status: deleted ? "ok" : "not_found" };
  } catch {
    return { status: "failed" };
  }
}

export type RelabelAccountOutcome = SimpleOutcome<"ok" | "not_found" | "failed">;

export async function relabelAccount(
  input: RelabelAccountFormInput,
  session: HouseholdSession,
  db: Database,
): Promise<RelabelAccountOutcome> {
  try {
    const updated = await createHouseholdAccountsRepository(householdScope(session)).relabel(db, {
      accountId: input.accountId,
      label: input.label,
      ownerUserId: session.userId,
    });
    return { status: updated ? "ok" : "not_found" };
  } catch {
    return { status: "failed" };
  }
}
