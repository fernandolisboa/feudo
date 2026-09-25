import { z } from "zod";

import type { CurrentSession } from "@/modules/auth";
import type { HouseholdScope, HouseholdSession } from "@/modules/households";
import { householdScope } from "@/modules/households";

import { errorName } from "@/lib/error-name";
import type { Outcome, SimpleOutcome } from "@/lib/outcome";
import type { Database } from "@/platform/db/client";
import { CONSENT_MAX_AGE_MS, CONSENT_SCOPE_VERSION, currentConsentScopeText } from "./consent-text";
import {
  decryptSecret,
  encryptSecret,
  EncryptionKeyMismatchError,
  MalformedCiphertextError,
} from "./crypto";
import { readEncryptionKey, type SyncEnv } from "./env";
import type {
  DataProvider,
  NormalizedAccount,
  NormalizedTransaction,
  ProviderClient,
  ProviderCredentials,
} from "./provider/provider";
import {
  endpointCollection,
  PROVIDER_REQUEST_TIMEOUT_MS,
  ProviderListingTooLongError,
  ProviderReadAbortedError,
  ProviderResponseShapeError,
  ProviderUnavailableError,
} from "./provider/provider";
import { getDataProvider } from "./provider/select";
import {
  ConnectionNotOwnedError,
  createHouseholdAccountsRepository,
  createSyncUserRepository,
  listConnectionsToSync,
  type ConnectionToSync,
  type DataProviderKind,
  type SyncUserRepository,
} from "./repository";
import { scopeForUser, userScope } from "./scope";
import type { ConnectionSyncFailure } from "./sync-status";
import { shouldNarrowFirstSync } from "./sync-status";
import { narrowedFirstSyncSince, transactionsSince } from "./transactions-window";
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

// The provider's own status and endpoint are the two facts that say whether a
// failed read is an outage, a rejected request or a payload Feudo cannot read.
// Only the endpoint's collection is kept: the rest of the path is a provider
// item id, which belongs in no log.
function providerFailureDetail(error: unknown): string {
  if (error instanceof ProviderUnavailableError) {
    return `${error.name} status=${error.status === undefined ? "none" : String(error.status)}`;
  }
  if (error instanceof ProviderResponseShapeError) {
    const fields = error.fields.length === 0 ? "" : ` fields=${error.fields.join(",")}`;
    return `${error.name} endpoint=${endpointCollection(error.endpoint)}${fields}`;
  }
  if (error instanceof ProviderListingTooLongError) {
    return `${error.name} endpoint=${endpointCollection(error.endpoint)}`;
  }
  return errorName(error);
}

function isProviderFailure(error: unknown): boolean {
  return (
    error instanceof ProviderUnavailableError ||
    error instanceof ProviderResponseShapeError ||
    error instanceof ProviderListingTooLongError
  );
}

function isUnreadableCredentialsFailure(error: unknown): boolean {
  return (
    error instanceof EncryptionKeyMismatchError ||
    error instanceof MalformedCiphertextError ||
    error instanceof SyntaxError ||
    error instanceof z.ZodError
  );
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

// A consent backs exactly one connection (ADR-0008): one already referenced
// by a connection cannot be replayed from the wizard's hidden field to
// record more connections under one checkbox.
async function findUsableConsent(
  repository: SyncUserRepository,
  db: Database,
  consentId: string,
): Promise<boolean> {
  const consent = await repository.findConsent(db, consentId);
  if (!consent || consent.used) {
    return false;
  }
  return Date.now() - consent.acceptedAt.getTime() <= CONSENT_MAX_AGE_MS;
}

// Server Actions never pass through Better Auth's limiter (auth/options.ts),
// so the two entry points that reach the provider keep their own per-user
// ceiling: enough for a person mistyping a secret, not for a script turning
// Feudo into a credential-testing proxy against Pluggy.
export const AUTH_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
export const AUTH_ATTEMPTS_PER_WINDOW = 5;

// Records the attempt before counting it: two requests racing to read the
// count below the ceiling before either commits its insert would otherwise
// both pass. Recording first means the count each sees already includes its
// own attempt, so the ceiling holds even when two attempts land together.
async function reserveAuthAttempt(repository: SyncUserRepository, db: Database): Promise<boolean> {
  await repository.recordAuthAttempt(db);
  const recent = await repository.countAuthAttemptsSince(
    db,
    new Date(Date.now() - AUTH_ATTEMPT_WINDOW_MS),
  );
  return recent <= AUTH_ATTEMPTS_PER_WINDOW;
}

type ConnectionFailure = "item_not_found" | "already_connected" | "provider_unavailable" | "failed";

type EstablishedConnection = { connectionId: string; accountsCount: number };

type ConnectionSnapshot = { accounts: NormalizedAccount[]; transactions: NormalizedTransaction[] };

// Investment positions are accounts of type "investment" in Feudo's shape
// (ADR-0005) but not accounts at the provider: their movements live behind
// another endpoint and are not part of the ledger yet, so only the accounts
// that hold transactions are asked for them.
async function readConnection(
  client: ProviderClient,
  providerItemId: string,
  since: string,
): Promise<ConnectionSnapshot> {
  const accounts = [
    ...(await client.listAccounts(providerItemId)),
    ...(await client.listInvestmentPositions(providerItemId)),
  ];
  const transactions: NormalizedTransaction[] = [];
  const seen = new Set<string>();
  for (const account of accounts) {
    if (account.type === "investment" || seen.has(account.providerAccountId)) {
      continue;
    }
    seen.add(account.providerAccountId);
    transactions.push(...(await client.listTransactionsSince(account.providerAccountId, since)));
  }
  return { accounts, transactions };
}

// Every provider read happens before the first write, and the writes share
// one transaction, so neither a provider failure nor a database failure
// leaves a half-synced connection behind. A concurrent submit of the same
// item loses on the unique index and is reported as already connected.
async function establishConnection(
  client: ProviderClient,
  repository: SyncUserRepository,
  db: Database,
  input: { providerItemId: string; consentId: string; assignTo: HouseholdScope },
): Promise<Outcome<EstablishedConnection, ConnectionFailure>> {
  const existing = await repository.findConnectionByItem(db, PROVIDER_KIND, input.providerItemId);
  if (existing) {
    return { status: "already_connected" };
  }

  const syncedAt = new Date();
  let described;
  let snapshot;
  let narrowedSince: string | null = null;
  try {
    described = await client.describeConnection(input.providerItemId);
    if (described.status === "not_found") {
      return { status: "item_not_found" };
    }
    try {
      snapshot = await readConnection(
        client,
        input.providerItemId,
        transactionsSince(syncedAt, null),
      );
    } catch (error) {
      // A listing too long to page through on the usual twelve-month window
      // is retried once, narrowed to the previous month (#84): without this,
      // an item with a very long transaction history could never be
      // connected at all. The narrowed date is persisted below so the daily
      // job's own first sync starts there too, rather than retrying twelve
      // months and hitting the same wall on its own first run.
      if (error instanceof ProviderListingTooLongError) {
        narrowedSince = narrowedFirstSyncSince(syncedAt);
        snapshot = await readConnection(client, input.providerItemId, narrowedSince);
      } else {
        throw error;
      }
    }
  } catch (error) {
    if (isProviderFailure(error)) {
      return { status: "provider_unavailable" };
    }
    throw error;
  }

  const institution = described.connection;
  try {
    return await db.transaction(async (tx) => {
      const connectionId = await repository.createConnection(tx, {
        provider: PROVIDER_KIND,
        providerItemId: input.providerItemId,
        institutionName: institution.institutionName,
        institutionProviderId: institution.institutionProviderId,
        consentId: input.consentId,
      });
      const accountsCount = await repository.upsertAccounts(tx, connectionId, snapshot.accounts, {
        assignTo: input.assignTo,
        syncedAt,
      });
      await repository.upsertTransactions(tx, connectionId, snapshot.transactions, { syncedAt });
      await repository.markSynced(tx, connectionId, { syncedAt, error: null });
      if (narrowedSince) {
        await repository.narrowFirstSync(tx, connectionId, narrowedSince);
      }
      return { status: "ok", connectionId, accountsCount };
    });
  } catch {
    const raced = await repository.findConnectionByItem(db, PROVIDER_KIND, input.providerItemId);
    return { status: raced ? "already_connected" : "failed" };
  }
}

type StoredCredentialsOutcome = Outcome<
  { credentials: ProviderCredentials },
  "no_credentials" | "credentials_unreadable"
>;

async function loadStoredCredentials(
  repository: SyncUserRepository,
  db: Database,
  encryptionKey: string,
): Promise<StoredCredentialsOutcome> {
  const stored = await repository.getCredential(db);
  if (!stored) {
    return { status: "no_credentials" };
  }
  try {
    return {
      status: "ok",
      credentials: deserializeCredentials(stored.ciphertext, encryptionKey),
    };
  } catch (error) {
    if (isUnreadableCredentialsFailure(error)) {
      return { status: "credentials_unreadable" };
    }
    throw error;
  }
}

type ProviderSessionOutcome = Outcome<
  { client: ProviderClient },
  "invalid_credentials" | "provider_unavailable"
>;

async function openProviderSession(
  provider: DataProvider,
  credentials: ProviderCredentials,
): Promise<ProviderSessionOutcome> {
  try {
    return await provider.authenticate(credentials);
  } catch (error) {
    if (isProviderFailure(error)) {
      return { status: "provider_unavailable" };
    }
    throw error;
  }
}

export type ConnectProviderOutcome = Outcome<
  EstablishedConnection,
  "consent_required" | "rate_limited" | "invalid_credentials" | ConnectionFailure
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
  if (!(await reserveAuthAttempt(repository, db))) {
    return { status: "rate_limited" };
  }

  const credentials: ProviderCredentials = {
    clientId: input.clientId,
    clientSecret: input.clientSecret,
  };
  const authenticated = await openProviderSession(deps.provider, credentials);
  if (authenticated.status !== "ok") {
    return { status: authenticated.status };
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
    assignTo: householdScope(session),
  });
}

export type AddConnectionOutcome = Outcome<
  EstablishedConnection,
  | "no_credentials"
  | "credentials_unreadable"
  | "rate_limited"
  | "invalid_credentials"
  | ConnectionFailure
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
  const stored = await loadStoredCredentials(repository, db, deps.encryptionKey);
  if (stored.status !== "ok") {
    return { status: stored.status };
  }
  if (!(await reserveAuthAttempt(repository, db))) {
    return { status: "rate_limited" };
  }

  const authenticated = await openProviderSession(deps.provider, stored.credentials);
  if (authenticated.status !== "ok") {
    return { status: authenticated.status };
  }

  const consent = await acceptConsent(session, db);
  if (consent.status !== "ok") {
    return { status: "failed" };
  }

  return establishConnection(authenticated.client, repository, db, {
    providerItemId: input.providerItemId,
    consentId: consent.consentId,
    assignTo: householdScope(session),
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
    const updated = await createHouseholdAccountsRepository(
      householdScope(session),
      userScope(session),
    ).relabel(db, { accountId: input.accountId, label: input.label });
    return { status: updated ? "ok" : "not_found" };
  } catch {
    return { status: "failed" };
  }
}

// Whether a deadline abort is the connection's own fault: `too_slow` when it
// got its own full per-connection slice (the run's abort fired no sooner
// than that slice was scheduled to) and still didn't finish, so its own
// listing is likely the reason and narrowing its next first sync helps;
// `timed_out` when the run itself was close enough to its deadline that the
// connection's own slice was cut short before it started, which is about
// where it landed in the queue, not its size.
function abortedFailureStatus(hadFullSlice: boolean): "too_slow" | "timed_out" {
  return hadFullSlice ? "too_slow" : "timed_out";
}

type ConnectionSyncOutcome = SimpleOutcome<"ok" | ConnectionSyncFailure>;

type CredentialsOutcome = Outcome<{ credentials: ProviderCredentials }, ConnectionSyncFailure>;

type CredentialsCache = Map<string, CredentialsOutcome>;

// Only the decrypted credentials are cached per user: a run's connections
// share one owner's secret but each gets its own abort signal (see
// syncAllConnections's maxConnectionSliceMs), so authenticating happens
// fresh per connection rather than once per user. One extra POST to the
// provider per connection is the cost of a signal that actually bounds that
// connection alone.
async function credentialsFor(
  cache: CredentialsCache,
  repository: SyncUserRepository,
  userId: string,
  db: Database,
  deps: SyncDeps,
): Promise<CredentialsOutcome> {
  const cached = cache.get(userId);
  if (cached) {
    return cached;
  }
  const outcome = await loadStoredCredentials(repository, db, deps.encryptionKey);
  cache.set(userId, outcome);
  return outcome;
}

// A rejected secret is a fact about the user, not the connection: once the
// provider has said so once this run, every other connection under the same
// user is skipped straight to the same status, saving a POST per connection
// for a secret that isn't going to become valid mid-run.
type InvalidCredentialsCache = Set<string>;

// Authenticating is itself a provider read and can be the one a connection's
// own slice catches in flight, so it is classified the same way a read is
// rather than through openProviderSession (which the wizard, never subject
// to a run deadline, still uses unchanged).
async function providerSessionFor(
  credentials: CredentialsCache,
  invalidCredentials: InvalidCredentialsCache,
  repository: SyncUserRepository,
  userId: string,
  db: Database,
  deps: SyncDeps,
  signal: AbortSignal,
  hadFullSlice: boolean,
): Promise<Outcome<{ client: ProviderClient }, ConnectionSyncFailure>> {
  const stored = await credentialsFor(credentials, repository, userId, db, deps);
  if (stored.status !== "ok") {
    return stored;
  }
  if (invalidCredentials.has(userId)) {
    return { status: "invalid_credentials" };
  }
  try {
    const outcome = await deps.provider.authenticate(stored.credentials, { signal });
    if (outcome.status === "invalid_credentials") {
      invalidCredentials.add(userId);
    }
    return outcome;
  } catch (error) {
    if (error instanceof ProviderReadAbortedError) {
      return { status: abortedFailureStatus(hadFullSlice) };
    }
    if (isProviderFailure(error)) {
      return { status: "provider_unavailable" };
    }
    throw error;
  }
}

// Feudo never asks the provider to re-read the bank: Meu Pluggy refreshes
// the connection every 24 hours on its own and a proxy item cannot be
// updated without the user's MFA (ADR-0005). The backfill window is decided
// by whether the ledger already holds history for this connection, not by
// its last sync time: a connection made before the transactions table
// shipped carries a successful sync and no transactions at all.
async function syncConnection(
  client: ProviderClient,
  repository: SyncUserRepository,
  db: Database,
  connection: ConnectionToSync,
  now: Date,
  hadFullSlice: boolean,
): Promise<ConnectionSyncOutcome> {
  let snapshot;
  let hasHistory = false;
  try {
    hasHistory = await repository.hasTransactions(db, connection.id);
    const since = hasHistory
      ? transactionsSince(now, connection.lastSyncedAt)
      : (connection.firstSyncSince ?? transactionsSince(now, null));
    snapshot = await readConnection(client, connection.providerItemId, since);
  } catch (error) {
    if (error instanceof ConnectionNotOwnedError) {
      throw error;
    }
    if (error instanceof ProviderReadAbortedError) {
      const status = abortedFailureStatus(hadFullSlice);
      console.warn(
        `sync: reading connection ${connection.id} was aborted by the run deadline (${status})`,
      );
      if (!hasHistory && shouldNarrowFirstSync(status, connection.lastSyncError)) {
        await repository.narrowFirstSync(db, connection.id, narrowedFirstSyncSince(now));
      }
      return { status };
    }
    if (error instanceof ProviderListingTooLongError) {
      console.warn(
        `sync: connection ${connection.id}'s ${endpointCollection(error.endpoint)} listing exceeded the page cap`,
      );
      if (!hasHistory && shouldNarrowFirstSync("listing_too_long", connection.lastSyncError)) {
        await repository.narrowFirstSync(db, connection.id, narrowedFirstSyncSince(now));
      }
      return { status: "listing_too_long" };
    }
    if (isProviderFailure(error)) {
      console.warn(
        `sync: reading connection ${connection.id} from the provider failed (${providerFailureDetail(error)})`,
      );
      return { status: "provider_unavailable" };
    }
    throw error;
  }

  try {
    const assignTo = await repository.householdOfConnection(db, connection.id);
    await db.transaction(async (tx) => {
      await repository.upsertAccounts(tx, connection.id, snapshot.accounts, {
        assignTo,
        syncedAt: now,
      });
      await repository.upsertTransactions(tx, connection.id, snapshot.transactions, {
        syncedAt: now,
      });
      await repository.markSynced(tx, connection.id, { syncedAt: now, error: null });
    });
    return { status: "ok" };
  } catch (error) {
    if (error instanceof ConnectionNotOwnedError) {
      throw error;
    }
    console.warn(`sync: writing a connection's snapshot failed (${errorName(error)})`);
    return { status: "failed" };
  }
}

export type ConnectionsSyncResult = {
  ok: boolean;
  synced: number;
  failed: number;
  gone: number;
  unreached: number;
};

// About one provider request timeout (PROVIDER_REQUEST_TIMEOUT_MS): starting
// a connection with less than this left on the clock would almost certainly
// time it out before its first read returns, so it is better left for the
// next run.
const MIN_CONNECTION_SLICE_MS = PROVIDER_REQUEST_TIMEOUT_MS;

// The daily job (ADR-0005): every connection, under its owner's own scope and
// credentials, one after the other, until the run's deadline. The run is
// reported as failed only when at least one connection was attempted and
// none of them synced, so one member's revoked credentials — or everything
// being deleted or unreached — does not turn every household's daily run
// red. `now` anchors the sync windows; `deadline` and `clock` are the run's
// own wall-clock budget and both default off the real clock regardless of
// `now`, so a test can hold `now` on a fixed date for window assertions
// without also having to fake the deadline check on every call. Every
// wall-clock reading in the run — every connection's own timer, every
// per-connection check — comes from this one `clock`, never `Date.now()`
// directly.
//
// Each connection gets its own AbortController, timed to at most half the
// run's total budget (maxConnectionSliceMs below): a single connection that
// has gone slow at the provider would otherwise sort first every run (see
// listConnectionsToSync) and could hold the whole run's clock, starving
// every connection behind it forever. Bounding each connection to at most
// half the run means a stuck connection costs at most half a run; the other
// half still rotates through the rest, since listConnectionsToSync orders by
// when a connection was last attempted, not by whether it last succeeded.
export async function syncAllConnections(
  db: Database,
  deps: SyncDeps,
  options: { now?: Date; deadline: Date; clock?: () => Date },
): Promise<ConnectionsSyncResult> {
  const now = options.now ?? new Date();
  const clock = options.clock ?? (() => new Date());
  const deadline = options.deadline;
  const runStartedAt = clock();
  const totalBudgetMs = deadline.getTime() - runStartedAt.getTime();
  const maxConnectionSliceMs = totalBudgetMs / 2;

  const connections = await listConnectionsToSync(db);
  const credentials: CredentialsCache = new Map();
  const invalidCredentials: InvalidCredentialsCache = new Set();

  let synced = 0;
  let failed = 0;
  let gone = 0;
  let unreached = 0;
  for (let index = 0; index < connections.length; index += 1) {
    // This connection's own reading of the clock, reused below to stamp
    // last_sync_attempted_at: two connections attempted in the same run get
    // their real, distinct order rather than the run's one shared instant.
    const attemptedAt = clock();
    const remainingMs = deadline.getTime() - attemptedAt.getTime();
    if (remainingMs < MIN_CONNECTION_SLICE_MS) {
      unreached += connections.length - index;
      break;
    }
    const connection = connections[index];
    if (!connection) {
      continue;
    }
    const sliceMs = Math.min(remainingMs, maxConnectionSliceMs);
    // Whether this connection got its own full slice, or less because the
    // run itself was close to its deadline when its turn came: see
    // abortedFailureStatus. Computed against the slice it actually got, not
    // the raw time left, so the two can never drift apart.
    const hadFullSlice = sliceMs === maxConnectionSliceMs;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, sliceMs);
    const repository = createSyncUserRepository(scopeForUser(connection.userId));
    try {
      // Stamped before any provider call: this is what rotates the queue
      // (listConnectionsToSync), so every connection gets a turn regardless
      // of how this one ends. A delete racing this write is the same
      // ConnectionNotOwnedError as any other write here, caught below.
      await repository.recordSyncAttempt(db, connection.id, attemptedAt);
      const session = await providerSessionFor(
        credentials,
        invalidCredentials,
        repository,
        connection.userId,
        db,
        deps,
        controller.signal,
        hadFullSlice,
      );
      const outcome =
        session.status === "ok"
          ? await syncConnection(session.client, repository, db, connection, now, hadFullSlice)
          : session;
      if (outcome.status === "ok") {
        synced += 1;
      } else {
        // Recorded before counting it as failed: a delete racing this
        // write (#79) throws ConnectionNotOwnedError, and the connection
        // belongs in `gone`, not double-counted here too.
        await repository.recordSyncFailure(db, connection.id, outcome.status);
        failed += 1;
      }
    } catch (error) {
      if (error instanceof ConnectionNotOwnedError) {
        console.warn(`sync: connection ${connection.id} was deleted mid-run`);
        gone += 1;
      } else {
        // Anything else — a transient DB error on either write above, a bug
        // in a provider implementation — is this one connection's problem,
        // not the run's: counted and logged by id only, so the rest of the
        // queue still gets its turn instead of the whole run coming back as
        // one opaque `{ error }` (runConnectionsSyncStep).
        console.warn(`sync: connection ${connection.id} failed unexpectedly (${errorName(error)})`);
        failed += 1;
      }
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: synced > 0 || failed === 0, synced, failed, gone, unreached };
}

export type ConnectionsSyncStep = ConnectionsSyncResult | { error: string };

// Route.ts owns the function's real time limit (`maxDuration`) and passes it
// down as `budgetMs`; this is what the in-flight connection's write (which
// does not observe the deadline, so it must be short) and the JSON response
// need back once the last connection's read returns.
const RUN_HEADROOM_MS = 15_000;

export async function runConnectionsSyncStep(
  db: Database,
  options: { budgetMs: number },
): Promise<ConnectionsSyncStep> {
  try {
    return await syncAllConnections(db, createSyncDeps(), {
      deadline: new Date(Date.now() + options.budgetMs - RUN_HEADROOM_MS),
    });
  } catch (error) {
    return { error: errorName(error) };
  }
}
