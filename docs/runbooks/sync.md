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
  `GET /transactions?accountId&from`. Shapes in
  `provider/pluggy-schemas.ts` are deliberately loose: unknown fields pass, a missing required one
  raises `ProviderResponseShapeError`. Rates arrive as percentages and are stored as ppm.
- `fake`: `provider/fake-provider.ts`, fixtures in `provider/fake-fixtures.ts` shaped like real
  Pluggy payloads. Any client id and secret are accepted except the secret `invalid`; the two item
  ids exported there resolve to "Banco Fixture" and "Corretora Fixture". Used by integration tests,
  the E2E run and Vercel Preview.

`DATA_PROVIDER=pluggy|fake` (default `pluggy`) selects the implementation; `fake` is refused when
`VERCEL_ENV=production` (`env.ts`).

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
