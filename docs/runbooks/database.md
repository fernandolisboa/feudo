# Database runbook

Feudo runs Postgres on Neon through the Vercel marketplace integration, with one Neon project per
environment:

- **`feudo` (production)**: the only place production personal data lives. Vercel Production env
  points at it. Never reset, never touched by CI.
- **`feudo-preview` (preview)**: a separate, free Neon project used by both Vercel Preview and
  Development env and by CI. It never receives a copy of production data — there is no restore
  step between the two projects — so it structurally cannot leak production personal data
  (ADR-0008). CI treats it as disposable: every `integration` job run drops and recreates its
  schema before migrating, so schema drift left over from any other branch never survives into the
  next run.

## Secrets

| secret                   | where                                                            | used by                                                                                                                                          |
| ------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL_PREVIEW`   | GitHub Actions secret                                            | CI `integration` job: resets the `feudo-preview` project's schema, migrates it, runs `pnpm test:integration`                                     |
| `DATABASE_URL`           | Vercel env (Production, Preview, Development)                    | the app itself, read by `apps/web/src/db/client.ts`; Preview and Development point at `feudo-preview`, Production at `feudo`                     |
| `DATABASE_RESET_ALLOWED` | GitHub Actions job env (CI only); exported by hand for local use | Required opt-in for `pnpm --filter @feudo/web db:reset`, `db:reset-schema` and the `withTestDb` test harness; all three refuse to run without it |

Secrets are set once, in this repo, through the GitHub CLI — never pasted into a workflow file or
committed:

```
gh secret set DATABASE_URL_PREVIEW
```

Until the owner adds `DATABASE_URL_PREVIEW`, the `integration` job's "Check preview database
secret" step emits a `::warning::` annotation, skips the rest of the job and exits successfully.
The job never prints a connection string or a database error text.

`gh secret set` prompts for the value on stdin; nothing is echoed and nothing is written to the
repo. `DATABASE_URL_PREVIEW` is the pooled connection string for the `feudo-preview` project, from
the Neon console or `vercel env pull` once the project exists.

## What the `integration` job does

On every push and pull request, once the `ci` job passes, `integration` runs against
`DATABASE_URL_PREVIEW`:

1. **Reset the preview project's schema** (`pnpm --filter @feudo/web db:reset-schema`): drops the
   `public` schema and Drizzle's `drizzle` migrations schema, cascading, then recreates an empty
   `public` schema. This starts every run from a database with no tables at all, not just no rows,
   so a migration or column left behind by another branch never survives into the next run.
2. **Migrate** (`pnpm --filter @feudo/web db:migrate`): applies every committed migration to the
   now-empty schema, which also recreates the `drizzle` migrations schema.
3. **Integration tests** (`pnpm test:integration`): runs `apps/web`'s integration Vitest project
   against the freshly migrated schema.

The `integration` job holds a `preview-db` concurrency group with `cancel-in-progress: false`, so
two runs that share the one `feudo-preview` project never reset or migrate it at the same time.

## Resetting the preview project locally

```
export DATABASE_URL=<feudo-preview connection string>
export DATABASE_RESET_ALLOWED=preview
pnpm --filter @feudo/web db:reset-schema   # drop and recreate public + drizzle schemas
pnpm --filter @feudo/web db:migrate        # apply committed migrations
```

`db:reset-schema` (`apps/web/scripts/reset-schema.mjs`, logic in
`apps/web/src/db/schema-reset.ts`) drops the `public` and `drizzle` schemas with `cascade` and
recreates an empty `public` schema. It refuses to run — before issuing any query — unless
`DATABASE_RESET_ALLOWED=preview` is set, and refuses unconditionally when `VERCEL_ENV=production`.

`db:reset` (`apps/web/scripts/reset-db.mjs`) and the `withTestDb` test harness
(`apps/web/src/db/test/harness.ts`) share a separate, faster truncate routine
(`apps/web/src/db/reset.ts`) that truncates every table already present in the `public` schema
with `restart identity cascade`, using safely quoted identifiers — it does not touch the schema
itself, so it is only useful once the schema has been migrated at least once. It shares the same
opt-in guard.

Run either reset only against `DATABASE_URL_PREVIEW`'s value, never against production.

## Integration tests

`pnpm test:integration` (root) runs `apps/web`'s Vitest integration project
(`vitest.integration.config.mts`) only when `DATABASE_URL` is set; without it, the script logs a
notice and exits 0 locally, and fails loudly (exit 1) when `CI` is set, since the CI job's own
"Check preview database secret" step is the only place allowed to decide to skip. `pnpm test`
(unit tests, `packages/core` and `apps/web`) never needs a database.

Tests use the `withTestDb` helper (`apps/web/src/db/test/harness.ts`): it truncates every table in
the `public` schema before the test body runs, so each test starts from a known-empty state.
Running it locally requires `DATABASE_RESET_ALLOWED=preview` (see above) and a schema that has
already been migrated.

## Health check

`GET /api/health` runs `select 1` against `DATABASE_URL` and returns `{ ok: true, db: true }`, or
status 503 with `{ ok: false, db: false }` if the database is unreachable. The result is memoized
for 10 seconds per warm instance, since the endpoint is public and unauthenticated. It never
returns the connection string or the underlying error. It stores nothing, so it has no entry in
the ADR-0008 data map.
