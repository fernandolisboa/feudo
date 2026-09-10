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

| name                          | kind                    | where                                          | used by                                                                                                                      |
| ----------------------------- | ----------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL_PREVIEW`        | GitHub Actions secret   | this repo                                      | CI `integration` job: resets the `feudo-preview` project's schema, migrates it, runs `pnpm test:integration`                 |
| `DATABASE_RESET_ALLOWED_HOST` | GitHub Actions variable | this repo (`vars.DATABASE_RESET_ALLOWED_HOST`) | CI `integration` job's reset and integration-test steps: must equal `new URL(DATABASE_URL).hostname`                         |
| `DATABASE_URL_PRODUCTION`     | GitHub Actions secret   | this repo                                      | CI `migrate-production` job: the only place this connection string is read outside the owner's own terminal                  |
| `DATABASE_PRODUCTION_HOST`    | GitHub Actions variable | this repo (`vars.DATABASE_PRODUCTION_HOST`)    | CI `migrate-production` job's guard step; also the belt-and-braces refusal in `assertDatabaseResetAllowed`                   |
| `DATABASE_URL`                | Vercel env              | Production, Preview, Development               | the app itself, read by `apps/web/src/db/client.ts`; Preview and Development point at `feudo-preview`, Production at `feudo` |

Secrets are set once, in this repo, through the GitHub CLI — never pasted into a workflow file or
committed:

```
gh secret set DATABASE_URL_PREVIEW
gh variable set DATABASE_RESET_ALLOWED_HOST --body "<feudo-preview pooler hostname>"
gh secret set DATABASE_URL_PRODUCTION
gh variable set DATABASE_PRODUCTION_HOST --body "<feudo (production) pooler hostname>"
```

`gh secret set` prompts for the value on stdin; nothing is echoed and nothing is written to the
repo. `DATABASE_URL_PREVIEW` is the pooled connection string for the `feudo-preview` project, and
`DATABASE_URL_PRODUCTION` is the pooled connection string for the `feudo` (production) project,
both from the Neon console or `vercel env pull` once the project exists. Because
`DATABASE_RESET_ALLOWED_HOST` and `DATABASE_PRODUCTION_HOST` are not secrets (they are hostnames,
not credentials) they are GitHub Actions **variables**, not secrets, and each value must equal its
project's pooler host exactly.

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
   now-empty schema, which also recreates the `drizzle` migrations schema.
3. **Integration tests** (`pnpm test:integration`): runs `apps/web`'s integration Vitest project
   against the freshly migrated schema.

The `integration` job holds a `preview-db` concurrency group with `cancel-in-progress: false`, so
two runs that share the one `feudo-preview` project never reset or migrate it at the same time.
`DATABASE_URL` and `DATABASE_RESET_ALLOWED_HOST` are set per step, only on the steps that need
them, not at job level.

## Production migrations

CI owns applying committed migrations to production. On every push to `main` (after `ci` and
`integration` both succeed), the `migrate-production` job in `.github/workflows/ci.yml`:

1. Guards the target: a small Node one-liner parses `DATABASE_URL`'s hostname, normalises it
   (lowercase, strip a trailing dot, strip a `-pooler` suffix from the first label — the same
   normalisation `databaseHost()` in `apps/web/src/db/reset-guard.ts` applies) and fails the job —
   printing only `PASS` or `FAIL`, never the URL — unless the normalised host equals the normalised
   `vars.DATABASE_PRODUCTION_HOST`. This is what stops a mispointed or stale
   `DATABASE_URL_PRODUCTION` secret, or a merely differently-cased or pooler/direct variant of the
   same host, from migrating the wrong database.
2. Runs `pnpm --filter @feudo/web db:migrate` (`drizzle-kit migrate`) against
   `secrets.DATABASE_URL_PRODUCTION`. Nothing resets or drops anything — `db:reset` and
   `db:reset-schema` never appear in this job, and `assertDatabaseResetAllowed` also refuses
   outright whenever `DATABASE_URL`'s host matches `DATABASE_PRODUCTION_HOST` (see "The reset
   guard" below), so even a copy-pasted step from the `integration` job would fail closed instead
   of dropping the production schema.

The job holds a `production-db` concurrency group (`cancel-in-progress: false`), separate from the
preview project's `preview-db` group, so two pushes to `main` in quick succession queue and migrate
production one at a time instead of racing. This depends on the workflow-level `ci-${{
github.ref }}` group never cancelling a run on `main` — its `cancel-in-progress` is
`github.ref != 'refs/heads/main'`, `false` for `main` and `true` for pull requests — because
`github.ref` is the same `refs/heads/main` for every push to `main`, and an unconditional
`cancel-in-progress: true` there would kill an in-flight `migrate-production` job outright before
the job-level group ever got to serialize anything. Failure is visible the normal GitHub Actions
way: a red check on the `main` branch's commit and run history — there is no separate alerting yet.

**By hand, in an emergency only** (CI down, or a migration needs to land before the next push to
`main`) — never with a reset script, and only from the repo root:

```
trap 'rm -f .env.production.local' EXIT
vercel env pull --environment=production --yes .env.production.local
grep '^DATABASE_URL=' .env.production.local
# Eyeball the host printed above: it must be the `feudo` project's, e.g. ep-dry-wildflower-…,
# never ep-late-flower-… (that is `feudo-preview`). Stop here if it looks wrong.
DATABASE_URL=$(sed -n 's/^DATABASE_URL="\(.*\)"$/\1/p' .env.production.local) \
  pnpm --filter @feudo/web exec drizzle-kit migrate
```

`vercel env pull --environment=production --yes <file>` requires being logged into the Vercel
account that owns the project and writes exactly the file named on the command line — passing no
file name pulls to `.env.local` instead, which this procedure does not read, so always name
`.env.production.local` explicitly. The `trap` deletes that file on exit (success or failure) so it
is never left on disk or committed; nothing is `export`ed into the shell's environment, only piped
into the one `drizzle-kit migrate` invocation that needs it. Confirm `GET /api/health` reports
`migrations.status: "up-to-date"` once the command finishes.

## The reset guard

`assertDatabaseResetAllowed` (`apps/web/src/db/reset-guard.ts`) runs before any reset query and:

- refuses unconditionally when `VERCEL_ENV=production`;
- requires `DATABASE_RESET_ALLOWED_HOST` to be set and to equal `new URL(DATABASE_URL).hostname`
  exactly — the guard is bound to the specific database it is allowed to touch, not to an
  environment label, so a stale or copy-pasted `DATABASE_URL` pointing at production or at a
  different project is refused even with the opt-in variable set;
- belt and braces: also refuses unconditionally whenever `DATABASE_PRODUCTION_HOST` is set and
  equals `DATABASE_URL`'s host, even if `DATABASE_RESET_ALLOWED_HOST` was (wrongly) set to the same
  value — the production host can never be a valid reset target, full stop.

## Resetting the preview project locally

```
export DATABASE_URL=<feudo-preview connection string>
export DATABASE_RESET_ALLOWED_HOST=<feudo-preview pooler hostname, e.g. from the connection string above>
pnpm --filter @feudo/web db:reset-schema   # drop and recreate public + drizzle schemas
pnpm --filter @feudo/web db:migrate        # apply committed migrations
```

`db:reset-schema` (`apps/web/scripts/reset-schema.mjs`, logic in
`apps/web/src/db/schema-reset.ts`) drops the `public` and `drizzle` schemas with `cascade`,
recreates an empty `public` schema and re-grants `usage, create` on it to `public`. It refuses to
run — before issuing any query — unless the guard above passes.

`db:reset` (`apps/web/scripts/reset-db.mjs`) and the `withTestDb` test harness
(`apps/web/src/db/test/harness.ts`) share a separate, faster truncate routine
(`apps/web/src/db/reset.ts`) that truncates every table already present in the `public` schema
with `restart identity cascade`, using safely quoted identifiers — it does not touch the schema
itself, so it is only useful once the schema has been migrated at least once. It shares the same
guard.

Both reset scripts print only `error.name` and `error.code` (when present) on failure for
non-guard errors, never `error.message` — the Postgres driver's error messages can include the
connection string. The guard's own `DatabaseResetNotAllowedError.message` is safe to print as-is;
it never contains a credential.

Run either reset only against `DATABASE_URL_PREVIEW`'s value, never against production.

## Integration tests

`pnpm test:integration` (root) runs `apps/web`'s Vitest integration project
(`vitest.integration.config.mts`) only when `DATABASE_URL` is set; without it, the script logs a
notice and exits 0 locally, and fails loudly (exit 1) when `CI` is set. `pnpm test` (unit tests,
`packages/core` and `apps/web`) never needs a database.

Tests use the `withTestDb` helper (`apps/web/src/db/test/harness.ts`): it truncates every table in
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
journal expects and has no extra ones), `ahead` (the database has at least one row the journal does
not — this wins over `behind` even if rows are also missing, since a `drizzle-kit migrate` run
against a database in this state is a silent no-op and needs manual recovery, see below), or
`unknown` (the query itself failed; logged server-side with `error.name` only, never the message).

The public response is `{ ok, db, migrations: { status } }` — no counts. `ok` is `true` only when
`db` is reachable and `migrations.status` is `"up-to-date"`; otherwise the route returns status 503. Applied/expected counts are logged server-side only, at most once per probe, never returned to
callers. This is what would have caught the 2026-09-09 incident described in issue #49:
connectivity alone (`db: true`) is not enough to call the deployment healthy.

The result is memoized for 10 seconds per warm instance and concurrent callers during that window
share one in-flight probe instead of each issuing their own queries, since the endpoint is public
and unauthenticated. It never returns the connection string or the underlying error. It stores
nothing, so it has no entry in the ADR-0008 data map.

## WebSocket driver on Vercel

`apps/web/src/db/client.ts` connects with `drizzle-orm/neon-serverless` and no `ws` option: Node 24
(the runtime everywhere, `.nvmrc`, and now `apps/web/package.json`'s `engines.node`) has a global
`WebSocket`, which `@neondatabase/serverless` v1 picks up automatically. Do not add the `ws`
package back — webpack bundling it broke `/api/health` in production (`TypeError: b.mask is not a
function`) because its `bufferutil` fallback does not survive minification.

`getDb()` attaches `attachPoolErrorLogger` (`apps/web/src/db/pool-error-logger.ts`) to the pool's
`error` event on creation, so Neon dropping an idle WebSocket on a warm serverless instance is
logged (`error.name`/`code` only, never the message) instead of becoming an uncaught exception.
