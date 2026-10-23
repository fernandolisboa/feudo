# Database runbook

Feudo runs Postgres on Neon through the Vercel marketplace integration, with one Neon project per
environment:

- **`feudo` (production)**: the only place production personal data lives. Vercel Production env
  points at it. Never reset by CI or by hand. The only CI job allowed near it is
  `migrate-production` (see below), which only ever runs `drizzle-kit migrate`.
- **`feudo-preview` (preview)**: a separate, free Neon project used by both Vercel Preview and
  Development env and by CI. It never receives a copy of production data — there is no restore
  step between the two projects — so it structurally cannot leak production personal data
  (ADR-0008). CI treats it as disposable: every `integration` job run drops and recreates its
  schema before migrating, so schema drift left over from any other branch never survives into the
  next run.

## How environments are wired

Production's `DATABASE_URL` is injected by the Vercel marketplace resource
`neon-byzantium-mountain`, connected to the Production environment only. Preview and Development's
`DATABASE_URL` is injected by the separate marketplace resource `feudo-preview`, connected to the
Preview and Development environments. Verified on 2026-09-09 with `vercel env pull` run once per
environment: production resolves to host `ep-dry-wildflower-…`, preview and development both
resolve to host `ep-late-flower-…`. The marketplace integration injects static per-environment
variables — it creates no Neon branch per deployment, in either project.

This leaves one known gap: because Preview and Development share the single `feudo-preview`
project, a Preview deployment (for any PR) can hit that project at the same moment CI's
`integration` job is running a schema reset against it. Acceptable for now — the `preview-db`
concurrency group only serializes CI runs against each other, not against Vercel Preview traffic —
and closes once E2E lands and needs its own predictable schema.

## Secrets and variables

| name                          | kind                    | where                                                                                                          | used by                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL_PREVIEW`        | GitHub Actions secret   | this repo                                                                                                      | CI `integration` job: resets the `feudo-preview` project's schema, migrates it, runs `pnpm test:integration`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `DATABASE_RESET_ALLOWED_HOST` | GitHub Actions variable | this repo (`vars.DATABASE_RESET_ALLOWED_HOST`)                                                                 | CI `integration` and `e2e` jobs' reset, migrate and integration-test steps, and every local shell or `.env.local` that connects to the preview project: must equal `new URL(DATABASE_URL).hostname` (see "The connection guard" below)                                                                                                                                                                                                                                                                                                                                                                                        |
| `DATABASE_URL_PRODUCTION`     | GitHub Actions secret   | this repo, `production` environment only                                                                       | CI `migrate-production` job: the only place this connection string is read outside the owner's own terminal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `DATABASE_PRODUCTION_HOST`    | GitHub Actions variable | this repo, both at repo level (`vars.DATABASE_PRODUCTION_HOST`) and duplicated in the `production` environment | CI `migrate-production` job's guard and migrate steps (read the `production` environment copy; the migrate step needs it because the connection guard only admits the production host when it is declared); also the belt-and-braces refusal in `assertDatabaseResetAllowed` in the `integration` and `e2e` jobs' reset and integration-test steps (read the repo-level copy, since those jobs have no `environment:`). Deliberately absent from the preview migrate steps: without it, a preview connection string repointed at production is refused by the allowed-host check instead of admitted by `drizzle-kit migrate` |
| `DATABASE_URL`                | Vercel env              | Production, Preview, Development                                                                               | the app itself, read by `apps/web/src/platform/db/client.ts`; Preview and Development point at `feudo-preview`, Production at `feudo`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `DATABASE_RESET_ALLOWED_HOST` | Vercel env              | Preview, Development                                                                                           | the connection guard in `getDb()` on Preview deployments (and in `next dev` after `vercel env pull --environment=development`): must equal the `feudo-preview` pooler host, the same value as the GitHub variable                                                                                                                                                                                                                                                                                                                                                                                                             |
| `DATABASE_PRODUCTION_HOST`    | Vercel env              | Production                                                                                                     | the connection guard in `getDb()` on Production deployments: must equal the `feudo` pooler host, the same value as the GitHub variable. Both Vercel variables must exist before a deployment that carries the guard, or every database call on that deployment is refused                                                                                                                                                                                                                                                                                                                                                     |

Secrets are set once, in this repo, through the GitHub CLI — never pasted into a workflow file or
committed:

```
gh secret set DATABASE_URL_PREVIEW
gh variable set DATABASE_RESET_ALLOWED_HOST --body "<feudo-preview pooler hostname>"
gh secret set DATABASE_URL_PRODUCTION --env production
gh variable set DATABASE_PRODUCTION_HOST --body "<feudo (production) pooler hostname>" --env production
gh variable set DATABASE_PRODUCTION_HOST --body "<feudo (production) pooler hostname>"
```

The two Vercel copies are set once from the same hostnames, and never need rotating:

```
vercel env add DATABASE_RESET_ALLOWED_HOST preview
vercel env add DATABASE_RESET_ALLOWED_HOST development
vercel env add DATABASE_PRODUCTION_HOST production
```

Rollout order for any change that makes the guard require a variable a deployment does not have
yet (the first one was PR #71): 1. create the Vercel variables above; 2. merge; 3. once the
production deployment of that merge is live, confirm `GET /api/health` returns 200. A deployment
built before step 1 refuses every database call, and `migrate-production` still succeeds on its
own, so a 503 from `/api/health` after the merge is the only signal that step 1 was skipped.

`gh secret set` prompts for the value on stdin; nothing is echoed and nothing is written to the
repo. `DATABASE_URL_PREVIEW` is the pooled connection string for the `feudo-preview` project, and
`DATABASE_URL_PRODUCTION` is the pooled connection string for the `feudo` (production) project,
both from the Neon console or `vercel env pull` once the project exists. `--env production` scopes
`DATABASE_URL_PRODUCTION` and one copy of `DATABASE_PRODUCTION_HOST` to the GitHub `production`
environment, which only `migrate-production` runs under; the second, unscoped `gh variable set
DATABASE_PRODUCTION_HOST` call is deliberate and not a duplicate to clean up — the `integration` and
`e2e` jobs have no `environment:` and so can only read the repo-level copy for their belt-and-braces
reset-guard check. Because `DATABASE_RESET_ALLOWED_HOST` and `DATABASE_PRODUCTION_HOST` are not
secrets (they are hostnames, not credentials) they are GitHub Actions **variables**, not secrets.
Each value must equal its project's pooler host once both sides are normalised the same way
`databaseHost()` does (lowercased, trailing dot stripped, `-pooler` suffix stripped from the first
label) — not necessarily byte-for-byte identical.

If `DATABASE_URL_PREVIEW` or `DATABASE_RESET_ALLOWED_HOST` is absent, the `integration` job's
reset step fails loudly (drizzle/Postgres errors under `CI`, or `DatabaseResetNotAllowedError` from
the guard) rather than skipping silently. If `DATABASE_URL_PRODUCTION` or
`DATABASE_PRODUCTION_HOST` is absent or mismatched, the `migrate-production` job's guard step fails
the job before any migration runs (see "Production migrations" below).

## What the `integration` job does

On every push and pull request, once the `ci` job passes, `integration` runs against
`DATABASE_URL_PREVIEW`:

1. **Reset the preview project's schema** (`pnpm --filter @feudo/web db:reset-schema`): drops the
   `public` schema and Drizzle's `drizzle` migrations schema, cascading, then recreates an empty
   `public` schema and grants `usage, create` on it back to `public` (Postgres removes that grant
   when a schema is dropped). This starts every run from a database with no tables at all, not just
   no rows, so a migration or column left behind by another branch never survives into the next
   run.
2. **Migrate** (`pnpm --filter @feudo/web db:migrate`): applies every committed migration to the
   now-empty schema, which also recreates the `drizzle` migrations schema. The step carries
   `DATABASE_RESET_ALLOWED_HOST` because `drizzle.config.ts` runs the connection guard, and not
   `DATABASE_PRODUCTION_HOST`, so a mispointed preview secret can only ever be refused here.
3. **Integration tests** (`pnpm test:integration`): runs `apps/web`'s integration Vitest project
   against the freshly migrated schema.

The `integration` job holds a `preview-db` concurrency group with `cancel-in-progress: false`, so
two runs that share the one `feudo-preview` project never reset or migrate it at the same time.
`DATABASE_URL` and `DATABASE_RESET_ALLOWED_HOST` are set per step, only on the steps that need
them, not at job level.

## Production migrations

CI owns applying committed migrations to production. On every push to `main`, the
`migrate-production` job — the only job in `.github/workflows/migrate-production.yml`, which is the
only workflow that runs on push:

1. Runs `drizzle-kit check`, so a journal or snapshot the merge left inconsistent stops the job
   before it opens a connection to production.
2. Guards the target: a small Node one-liner parses `DATABASE_URL`'s hostname, normalises it
   (lowercase, strip a trailing dot, strip a `-pooler` suffix from the first label — the same
   normalisation `databaseHost()` in `apps/web/src/platform/db/host-policy.ts` applies) and fails the job —
   printing only `PASS` or `FAIL`, never the URL — unless the normalised host equals the normalised
   `vars.DATABASE_PRODUCTION_HOST`. This is what stops a mispointed or stale
   `DATABASE_URL_PRODUCTION` secret, or a merely differently-cased or pooler/direct variant of the
   same host, from migrating the wrong database.
3. Runs `pnpm --filter @feudo/web db:migrate` (`drizzle-kit migrate`) against
   `secrets.DATABASE_URL_PRODUCTION`, with `DATABASE_PRODUCTION_HOST` set so the connection guard
   in `drizzle.config.ts` admits the production host, which it does for the `migrate` command
   only. Nothing resets or drops anything — `db:reset` and `db:reset-schema` never appear in this
   job, and `assertDatabaseResetAllowed` also refuses outright whenever `DATABASE_URL`'s host
   matches `DATABASE_PRODUCTION_HOST` (see "The reset guard" below), so even a copy-pasted step
   from the `integration` job would fail closed instead
   of dropping the production schema.

The workflow holds a `production-db` concurrency group with `cancel-in-progress: false`, separate
from the preview project's `preview-db` group, so two pushes to `main` in quick succession queue
and migrate production one at a time instead of racing, and a second push never kills an in-flight
migration. With three or more in quick succession, GitHub cancels the run left _pending_ when a
newer one arrives, so a middle commit can carry a cancelled `migrate-production` check; the
migrations are cumulative, so the last run still applies everything, but do not read that cancelled
check as a failure.

Because the job no longer waits on `ci` and `integration`, the migration now starts as soon as the
merge lands rather than a few minutes later, which usually puts it ahead of the Vercel production
deployment instead of behind it. Schema-first is the right order for an additive migration and the
wrong one for a destructive change, which meets the still-running old code sooner: expand first,
contract in a later deploy. Failure is visible the normal GitHub Actions way: a red check on the `main` branch's
commit and run history — there is no separate alerting yet.

Nothing else runs on push. `main` moves only through a squash-merge of a pull request whose `ci`
and `integration` checks were green and up to date with `main`, so the tree that lands here has
already been built, linted, typechecked and tested; re-running that suite on push cost roughly 18%
of the repository's Actions minutes to re-prove a known result (`docs/runbooks/ci-minutes.md`). The
consequence to keep in mind: if branch protection on `main` is ever relaxed to allow a direct push
or a merge with stale checks, an unverified tree reaches `migrate-production`. The `drizzle-kit
check` step and the host guard are the only gates left at that point.

**By hand, in an emergency only** (CI down, or a migration needs to land before the next push to
`main`) — never with a reset script, and only from the repo root:

```
(
  trap 'rm -f .env.production.local' EXIT
  vercel env pull --environment=production --yes .env.production.local
  sed -n 's/^DATABASE_URL=".*@\([^/:?]*\).*/\1/p' .env.production.local
  # Eyeball the host printed above: it must be the `feudo` project's, e.g. ep-dry-wildflower-…,
  # never ep-late-flower-… (that is `feudo-preview`). Stop here if it looks wrong.
  DATABASE_PRODUCTION_HOST=<the host printed above> \
  DATABASE_URL=$(sed -n 's/^DATABASE_URL="\(.*\)"$/\1/p' .env.production.local) \
    pnpm --filter @feudo/web exec drizzle-kit migrate
)
```

`DATABASE_PRODUCTION_HOST` has to be typed by hand, from the host you just eyeballed: the connection
guard in `drizzle.config.ts` refuses any host that the environment does not declare, and declaring
the production host is the deliberate act that makes a manual production migration possible.

`vercel env pull --environment=production --yes <file>` requires being logged into the Vercel
account that owns the project and writes exactly the file named on the command line — passing no
file name pulls to `.env.local` instead, which this procedure does not read, so always name
`.env.production.local` explicitly. The whole block runs in a `( … )` subshell so the `trap` fires
when the block ends, not only when the interactive shell itself exits, and the file is never left
on disk or committed. The `sed` that eyeballs the host prints only the hostname, never the full
connection string, so nothing with a credential in it ever reaches the terminal or a scrollback log;
the second `sed` (used only inline in the `DATABASE_URL=…` assignment) is the one place the full
string is extracted, and it is piped straight into the one `drizzle-kit migrate` invocation that
needs it, never `export`ed into the shell's environment. Confirm `GET /api/health` reports
`migrations.status: "up-to-date"` once the command finishes.

## The connection guard

Nothing in this repo may connect to a database the environment did not explicitly declare. On
2026-09-09 an agent inherited a `TEST_DATABASE_URL` from the owner's shell profile that pointed at
another project's production Neon database and ran against it; the guard exists so that a
connection string merely present in the environment is never enough.

`assertDatabaseConnectionAllowed` (`apps/web/src/platform/db/connection-guard.ts`) runs inside
`getDb()` before the pool is created, so it covers the app on Vercel, `next dev`, every script under
`apps/web/scripts`, the integration-test harness and any test or script that calls `getDb()`
directly. `drizzle.config.ts` runs it as well whenever `DATABASE_URL` is set, so `db:migrate`,
`db:generate` and `db:check` are covered too. There is no environment in which it is skipped. It
shares its host policy with the reset guard (`apps/web/src/platform/db/host-policy.ts`) and:

- requires `DATABASE_URL` to parse and, after `databaseHost()` normalisation, its host to equal
  `DATABASE_RESET_ALLOWED_HOST`;
- refuses the host that equals `DATABASE_PRODUCTION_HOST` even when it is also the allowed host,
  except in two places that opt in: `getDb()` when both `VERCEL_ENV` and `NODE_ENV` are
  `production` (the deployed app; a production env file pulled into `next dev` still fails, since
  `next dev` runs with `NODE_ENV=development`), and `drizzle.config.ts` for the `migrate` command
  only (`migrate-production` and the manual
  emergency migration). `drizzle-kit push`, `drop`, `check` or `studio` never admit the production
  host.

Because the guard never skips, every environment declares its host: Vercel Production carries
`DATABASE_PRODUCTION_HOST`, Vercel Preview and Development carry `DATABASE_RESET_ALLOWED_HOST` (see
the table above), CI passes the GitHub variables to each step that connects, and a local shell or
`.env.local` sets `DATABASE_RESET_ALLOWED_HOST` by hand. The guard is deliberately not keyed on
`VERCEL=1` or any other variable the platform injects: `vercel env pull` writes those same variables
into the pulled file, so a skip based on them would be switched off by the very workflow that
fetches a preview connection string.

The error names the missing or mismatched variable and never includes the URL or its host. In
practice: an exported `DATABASE_URL` alone fails fast with `DATABASE_RESET_ALLOWED_HOST is not set`;
a shell that exports a URL for one project and declares the host of another fails with
`DATABASE_RESET_ALLOWED_HOST does not match DATABASE_URL's host`. Note that `next dev` reads an
already-exported `DATABASE_URL` in preference to `.env.local`, so a stale shell export used to win
silently; with the guard it is refused unless the declared host matches it.

## The reset guard

`assertDatabaseResetAllowed` (`apps/web/src/platform/db/reset-guard.ts`) runs before any reset query and:

- refuses unconditionally when `VERCEL_ENV=production`;
- requires `DATABASE_RESET_ALLOWED_HOST` to be set and, once both are normalised through
  `databaseHost()` (lowercased, trailing dot stripped, `-pooler` suffix stripped from the first
  label), to equal `new URL(DATABASE_URL).hostname` — the guard is bound to the specific database
  it is allowed to touch, not to an environment label, so a stale or copy-pasted `DATABASE_URL`
  pointing at production or at a different project is refused even with the opt-in variable set,
  and a merely differently-cased or pooler/direct variant of the same host no longer slips past it;
- belt and braces: also refuses unconditionally whenever `DATABASE_PRODUCTION_HOST` is set and,
  after the same normalisation, equals `DATABASE_URL`'s host, even if `DATABASE_RESET_ALLOWED_HOST`
  was (wrongly) set to the same value — the production host can never be a valid reset target, full
  stop.

## Resetting the preview project locally

```
export DATABASE_URL=<feudo-preview connection string>
export DATABASE_RESET_ALLOWED_HOST=<feudo-preview pooler hostname, e.g. from the connection string above>
pnpm --filter @feudo/web db:reset-schema   # drop and recreate public + drizzle schemas
pnpm --filter @feudo/web db:migrate        # apply committed migrations
```

`db:reset-schema` (`apps/web/scripts/reset-schema.mjs`, logic in
`apps/web/src/platform/db/schema-reset.ts`) drops the `public` and `drizzle` schemas with `cascade`,
recreates an empty `public` schema and re-grants `usage, create` on it to `public`. It refuses to
run — before issuing any query — unless the guard above passes.

`db:reset` (`apps/web/scripts/reset-db.mjs`) and the `withTestDb` test harness
(`apps/web/src/platform/db/test/harness.ts`) share a separate, faster truncate routine
(`apps/web/src/platform/db/reset.ts`) that truncates every table already present in the `public` schema
with `restart identity cascade`, using safely quoted identifiers — it does not touch the schema
itself, so it is only useful once the schema has been migrated at least once. It shares the same
guard.

Both reset scripts print only `error.name` and `error.code` (when present) on failure for
non-guard errors, never `error.message` — the Postgres driver's error messages can include the
connection string. The guard's own `DatabaseResetNotAllowedError.message` is safe to print as-is;
it never contains a credential.

Run either reset only against `DATABASE_URL_PREVIEW`'s value, never against production.

## Running the app locally

`next dev` connects through the same `getDb()`, so `.env.local` needs both lines:

```
DATABASE_URL=<feudo-preview connection string>
DATABASE_RESET_ALLOWED_HOST=<feudo-preview pooler hostname>
```

Without the second line every page that touches the database fails with
`DATABASE_RESET_ALLOWED_HOST is not set`. That is the guard doing its job, not a misconfiguration to
route around: declare the host of the database you mean to use. `vercel env pull
--environment=development .env.local` writes both lines, since the Development environment carries
`DATABASE_RESET_ALLOWED_HOST`; it also writes `VERCEL=1` and `VERCEL_ENV=development`, which the
guard ignores on purpose.

## Integration tests

`pnpm test:integration` (root) runs `apps/web`'s Vitest integration project
(`vitest.integration.config.mts`) only when `DATABASE_URL` is set; without it, the script logs a
notice and exits 0 locally, and fails loudly (exit 1) when `CI` is set. `pnpm test` (unit tests,
`packages/core` and `apps/web`) never needs a database.

Tests use the `withTestDb` helper (`apps/web/src/platform/db/test/harness.ts`): it truncates every table in
the `public` schema before the test body runs, so each test starts from a known-empty state.
Running it locally requires `DATABASE_RESET_ALLOWED_HOST` (see above) and a schema that has already
been migrated.

## Health check

`GET /api/health` runs `select 1` against `DATABASE_URL` and also compares the full multiset of
`drizzle.__drizzle_migrations.created_at` values against every `when` in the committed journal
(`apps/web/drizzle/meta/_journal.json`, bundled into the server build) — `drizzle-kit migrate`
always writes `created_at = journal.when` for every row it applies, so this is a reliable
membership check without needing to read the migration `.sql` files at runtime. It reports one of
four states: `up-to-date` (the two sets match exactly), `behind` (the database is missing rows the
journal expects and has no extra ones — this is also what a schema with no `drizzle` migrations
table at all reports, SQLSTATE `42P01`, rather than `unknown`, since a never-migrated database is a
normal, recoverable form of "behind"), `ahead` (the database has at least one row the journal does
not — this wins over `behind` even if rows are also missing, since a `drizzle-kit migrate` run
against a database in this state is a silent no-op and needs manual recovery, see below), or
`unknown` (the query failed for any other reason, or did not finish within the probe's 5-second
deadline; logged server-side with `error.name` only, never the message).

The public response is `{ ok, db, migrations: { status } }` — no counts. `ok` is `true` only when
`db` is reachable and `migrations.status` is `"up-to-date"`; otherwise the route returns status 503. Applied/expected counts are logged server-side only, at most once per probe, never returned to
callers. This is what would have caught the 2026-09-09 incident described in issue #49:
connectivity alone (`db: true`) is not enough to call the deployment healthy.

The result is memoized for 10 seconds per warm instance and concurrent callers during that window
share one in-flight probe instead of each issuing their own queries, since the endpoint is public
and unauthenticated. A probe that does not settle within 5 seconds (a hung connection, for example)
resolves to `{ db: false, migrations: { status: "unknown" } }` instead of leaving the endpoint
hanging; that result is cached the same as any other for the remainder of the 10-second window, not
retried immediately, so a hang cannot make every concurrent request wait out its own 5-second
deadline. It never returns the connection string or the underlying error. It stores nothing, so it
has no entry in the ADR-0008 data map.

Because Vercel deploys `main` independently of `migrate-production` finishing, expect
`migrations.status: "behind"` (503) from a fresh deployment of `main` until the `migrate-production`
job for that same commit turns green — that gap is normal, not an incident. A 503 that persists
after `migrate-production` is green, a `migrations.status: "ahead"`, or a `migrations.status:
"unknown"` that does not clear on its own within a probe cycle or two, is the incident.

**Recovery from `migrations.status: "ahead"`**: this means `drizzle.__drizzle_migrations` has a row
whose `created_at` is not in the committed journal — most often a migration applied from a branch
that was later reverted or renumbered, or a manually-inserted row. `drizzle-kit migrate` will not
re-apply anything in this state, so pushing more migrations does not fix it. Diagnose by hand
against production (see the emergency `vercel env pull` procedure above for extracting
`DATABASE_URL` without exporting it): compare `select id, hash, created_at from
drizzle.__drizzle_migrations order by created_at` against `apps/web/drizzle/meta/_journal.json`'s
`entries`, identify the row(s) with no matching `when`, and either delete the stray row (if the
schema change it represents was already reverted or is superseded by a later committed migration)
or commit a new migration whose journal entry's `when` matches the stray `created_at` (if the
schema change is real and should be kept). Never run `db:reset` or `db:reset-schema` against
production to "fix" this — both refuse outright (see "The reset guard" below) and neither is the
right tool for a database holding real household data.

## WebSocket driver on Vercel

`apps/web/src/platform/db/client.ts` connects with `drizzle-orm/neon-serverless` and no `ws` option: Node 24
(the runtime everywhere, `.nvmrc`, and now `apps/web/package.json`'s `engines.node`) has a global
`WebSocket`, which `@neondatabase/serverless` v1 picks up automatically. Do not add the `ws`
package back — webpack bundling it broke `/api/health` in production (`TypeError: b.mask is not a
function`) because its `bufferutil` fallback does not survive minification.

`getDb()` attaches `attachPoolErrorLogger` (`apps/web/src/platform/db/pool-error-logger.ts`) to the pool's
`error` event on creation, so Neon dropping an idle WebSocket on a warm serverless instance is
logged (`error.name`/`code` only, never the message) instead of becoming an uncaught exception.
