# Sync runbook

The `sync` module (`apps/web/src/modules/sync`) owns bank-connection consent, the Meu Pluggy
wizard, provider credentials, bank connections and the accounts they expose (#12, ADR-0005,
ADR-0008). Its public surface is `apps/web/src/modules/sync/index.ts`:

- Components: `ConnectBankWizard` (`/conectar-banco`) and `AccountsSection` (the "Contas" block of
  the overview, with the foreign-currency section and the viewer's own connections panel).
- Page-level data assembly: `getAccountsSectionProps(session)`.
- `t` and the daily housekeeping entry point `runDailyPruneStep`.

Everything else (`service.ts`, `repository.ts`, `actions.ts`, `validation.ts`, `scope.ts`,
`crypto.ts`, `document-hash.ts`, `provider/`) is module-private.

## Two scopes, one invariant (ADR-0001)

- **User-scoped**: `provider_credential`, `bank_connection_consent`, `bank_connection`,
  `provider_auth_attempt`. Reached only
  through `createSyncUserRepository(userScope(session))`; every method closes over the session's
  user id and a connection id is honoured only after the row is re-read under that scope.
- **Household-scoped**: `bank_account` (read through
  `createHouseholdAccountsRepository(householdScope(session))`). `household_id` is nullable only to
  mean "unassigned" (the household was deleted); an unassigned account is visible only to its
  owner until reassigned (ADR-0001). Household deletion is not implemented yet, so no code path
  produces such a row today. Writes to `bank_account` go only through the user-scoped
  connection repository (`upsertAccounts`), and the label is changed only by the household member
  who owns the connection.

`repository.integration.test.ts` proves both: user A never reads, reuses or deletes user B's
credential, consent or connection; household A never lists or relabels household B's accounts.

## The wizard

1. **Consent** (`acceptConsentAction`): the checkbox records a `bank_connection_consent` row with
   the scope version (`CONSENT_SCOPE_VERSION`) and the exact text shown (`consent-text.ts`). The
   row's id travels to step 3 as a hidden field; a connection is refused without a consent that
   belongs to the session's user, is at most 24h old (`CONSENT_MAX_AGE_MS`) and does not already
   back a connection (one consent, one connection). Consents that never backed a connection are
   pruned daily once older than that.
2. **Guide**: the steps to create a Meu Pluggy account, connect banks there, generate an API client
   and copy the Item ID of one connection. Pluggy's API has no list-items endpoint, so the wizard
   asks for the Item ID instead of listing the user's connections.
3. **Credentials** (`connectProviderAction` → `sync.connectProvider`): authenticates against the
   provider first (`invalid_credentials` saves nothing), stores the credentials as one AES-256-GCM
   envelope (`enc:v1:<keyId>:…`, `crypto.ts`), reads the item and its accounts and investment
   positions, then creates the connection and upserts the accounts into the active household with
   the default label `individual`. Every provider read happens before the first write, so a
   provider failure after the credential check leaves no half-synced connection.

More banks: "Adicionar conexão" (`addConnectionAction`) reuses the stored credentials and records a
fresh consent row for the new connection.

Both entry points that reach the provider are rate-limited per user, since Server Actions never pass
through Better Auth's limiter: at most `AUTH_ATTEMPTS_PER_WINDOW` (5) attempts per
`AUTH_ATTEMPT_WINDOW_MS` (15 minutes), counted in `provider_auth_attempt` before any request leaves
for Pluggy; the sixth returns `rate_limited`. The connection, its accounts and the sync stamp are
written in one transaction: a failure after the provider answered leaves no connection row, and a
concurrent submit of the same Item ID is reported as already connected.

## Removal

- **Remover credenciais** (`removeCredentials`): deletes the `provider_credential` row and nothing
  else. Sync stops (nothing left to authenticate with); connections and accounts stay until deleted.
- **Excluir conexão** (`deleteConnection`): deletes the connection, its accounts (cascade) and, in
  the same transaction, its consent row (a consent backs exactly one connection).

## Providers (ADR-0005)

`DataProvider` (`provider/provider.ts`) has one method, `authenticate(credentials)`, returning a
`ProviderClient` with `describeConnection`, `listAccounts`, `listInvestmentPositions` and
`listTransactionsSince`; every payload is normalized into `normalizedAccountSchema` /
`normalizedTransactionSchema` before anything else touches it. Investment positions are accounts
of type `investment`. The interface reads only: asking Pluggy to update a Meu Pluggy connection
answers 400, and Meu Pluggy refreshes it every 24 hours anyway (ADR-0005).

- `pluggy`: `provider/pluggy-provider.ts`, `https://api.pluggy.ai`, `POST /auth` → `X-API-KEY`,
  `GET /items/{id}`, `GET /accounts?itemId`, `GET /investments?itemId`,
  `GET /v2/transactions?accountId&dateFrom`, which pages by cursor: the `after` value inside the
  response's `next` is what the following request carries, and a cursor that repeats or is missing
  raises `ProviderResponseShapeError`. The paged `GET /transactions` it replaces was retired by
  Pluggy and answers 410. Shapes in
  `provider/pluggy-schemas.ts` are deliberately loose: unknown fields pass, a missing required one
  raises `ProviderResponseShapeError`. Rates arrive as percentages and are stored as ppm.
- `fake`: `provider/fake-provider.ts`, fixtures in `provider/fake-fixtures.ts` shaped like real
  Pluggy payloads. Any client id and secret are accepted except the secret `invalid`; the two item
  ids exported there resolve to "Banco Fixture" and "Corretora Fixture". Used by integration tests,
  the E2E run and Vercel Preview.

`DATA_PROVIDER=pluggy|fake` (default `pluggy`) selects the implementation; `fake` is refused when
`VERCEL_ENV=production` (`env.ts`).

## The daily run (`/api/cron/sync`, `syncAllConnections`)

The cron route's response is `{ ok, steps: { connections: { ok, synced, failed, gone, unreached } } }`
(or `{ error }` if the step itself threw before returning a count). Reading the counts:

- `synced` / `failed`: connections attempted this run and how each ended; a failed one's
  `bank_connection.last_sync_error` names why (`provider_unavailable`, `listing_too_long`,
  `too_slow`, `timed_out`, `invalid_credentials`, `no_credentials`, `credentials_unreadable`,
  `failed`).
- `gone`: the connection was deleted (by its owner, through the app) while this run was reading it;
  nothing was recorded for it, nothing to act on. Recording a failure and counting a connection as
  `failed` happen in that order, so a delete racing the failure write is counted `gone`, never both.
- `unreached`: the run's deadline (`runConnectionsSyncStep`'s `budgetMs`, from the route's own
  `maxDuration`, minus `RUN_HEADROOM_MS`; ADR-0005) left too little time to start it; it is
  untouched and picked up by tomorrow's run, sooner if it is one of the connections ordering keeps
  near the front (see below).
- `ok` is true unless at least one connection was attempted and every attempted one failed — a run
  that only found deleted or unreached connections is not an incident.
- An error other than `ConnectionNotOwnedError` raised while a connection is being attempted (a
  transient database failure, a bug in a provider implementation) is caught for that connection
  alone: counted `failed` and logged (`console.warn`) with the error's name and the connection's id
  only, nothing else. The run moves on to the next connection instead of the whole step coming back
  as `{ error }` for every connection in it.

`bank_connection` carries two columns just for the daily job (migration
`0011_sync_connection_attempt_and_narrowing.sql`, additive, both nullable), neither ever read
anywhere else: `last_sync_attempted_at`, stamped at the start of every attempt — before any provider
call, so even a connection that fails before it gets that far still moves — from that connection's
own reading of the run's clock rather than the run's one shared instant, so two connections attempted
in the same run keep their real order — and `first_sync_since`, the sticky narrowing memory described
below.

`listConnectionsToSync` orders strictly by `last_sync_attempted_at asc nulls first, created_at asc`
and nothing else. Every connection rotates round-robin regardless of how its last attempt ended.
Attempt-time ordering ensures this structurally and combines with the per-connection slice below so
that even several stuck connections at the head of the queue cost the rest of it at most half a run
each, not a turn that never comes.

Every connection also gets its own abort budget, at most half the run's total (a local
`maxConnectionSliceMs`, derived from the run's own deadline, not a second hard-coded number): it caps
how long any single connection's reads — including authenticating, itself a provider read — can run
before that connection's own `AbortController` cuts it. Without this bound a single slow connection
could hold the whole run's clock by itself. Bounded per connection, a stuck connection costs at most
half a run — the other half still rotates through the rest, so throughput degrades when one or more
connections are stuck, it does not stop; every connection still gets its own turn on the next run,
and the one after that.

Three statuses are about running out of time or bandwidth, not the bank, and each means something
different for what to do next:

- `too_slow`: this connection's own abort budget ran out before its read finished, and it got its
  full slice (half the run) to itself — its own listing is the likely reason.
- `timed_out`: the same cut, but the run itself was close enough to its deadline that this
  connection got less than its full slice — about where it landed in the queue, not its own size.
- `listing_too_long`: a listing kept offering more pages than the provider paginators' cap.

All three clear `last_sync_error` on the next successful sync like any other error. A first sync
(no transactions in the ledger yet for this connection) that fails `listing_too_long` or `too_slow`
sets `first_sync_since` to the previous month once, the first time it happens, if still unset. A lone
`timed_out` does not narrow by itself, since on its own it says nothing about this connection's own
size; but two deadline aborts in a row for the same connection, this run's `timed_out` following a
`too_slow` or `timed_out` read off the row before this run's own outcome overwrites it, do narrow,
since that pattern means the connection keeps losing its slice to something else in the queue rather
than to its own history — otherwise a first sync queued behind a stuck connection would land just
under its slice every single run and never make progress. Once set, `first_sync_since` is not touched
again: an intervening `timed_out` or provider outage, or even a narrowed sync that succeeds with zero
new transactions, leaves it as is. It only stops mattering once the ledger actually holds a
transaction for this connection, at which point the incremental window applies and `first_sync_since`
is never read again. A connection whose first sync is already narrowed and still comes back
`too_slow` keeps failing visibly and keeps rotating through the queue every run — an operator signal
that its own history, not the run's clock, is the problem. The wizard's own first sync
(`connectProvider`/`addConnection`) gets a one-shot narrowed retry inline on `listing_too_long`; on
success it persists that narrowed date as `first_sync_since` in the same transaction that creates the
connection, so the daily job starts from it too instead of reverting to the full twelve months if the
narrowed month turns out to have had no transactions.

## Environment

| variable            | where                                        | notes                                                                                                                                              |
| ------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ENCRYPTION_KEY`    | Vercel env (Production, Preview), ≥ 32 chars | Key material for the credential envelope; rotating it invalidates stored credentials (key id mismatch surfaces as a decrypt error, users re-enter) |
| `DOCUMENT_HASH_KEY` | Vercel env (Production, Preview), ≥ 32 chars | HMAC secret for holder documents; separate from the encryption key on purpose (ADR-0008)                                                           |
| `DATA_PROVIDER`     | Vercel env (Preview: `fake`); unset in prod  | Production always uses the real provider                                                                                                           |

Both secrets go in through `vercel env add <NAME> <environment> --sensitive`, never through chat or
the repo. Integration tests set their own throwaway values in-process; the E2E run reads them from
the preview deployment.

## Manual smoke test (real Meu Pluggy)

Meu Pluggy has no sandbox, so the real provider is checked by hand on a preview or production
deployment with `DATA_PROVIDER` unset: sign in, `/conectar-banco`, accept the consent, paste the
client id, client secret and one Item ID from the Meu Pluggy dashboard, and confirm the accounts
land in the overview with the right balances. Record the result in the PR that changes the provider.
