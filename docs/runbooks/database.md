# Database runbook

Feudo runs Postgres on Neon through the Vercel marketplace integration. There is exactly one
non-production branch: `preview`. Every CI run and every Vercel preview deployment talks to it.
The Neon–Vercel integration's automatic per-deployment branching stays off (Free-tier branch
limits have broken CI on other projects); a branch per preview deployment is never created.

## Branches

| branch    | used by                                    | reset                                                                                                                                                                                  |
| --------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main`    | Production Vercel deployments              | never                                                                                                                                                                                  |
| `preview` | CI (`integration` job) and Vercel previews | data truncated at the start of each CI run; after every merge to `main`, the branch is restored from `main` and its data is truncated again so it never keeps production personal data |

## Secrets

| secret                   | where                                                            | used by                                                                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL_PREVIEW`   | GitHub Actions secret                                            | CI `integration` job: migrates the `preview` branch, resets its data, runs `pnpm test:integration`; CI `reset-preview` job: truncates `preview` right after restoring it from `main`                         |
| `NEON_API_KEY`           | GitHub Actions secret                                            | CI `reset-preview` job: restores the `preview` branch from `main` after every push to `main`. Scope it to this project (or a dedicated Neon account), never a full-account key with access to other projects |
| `NEON_PROJECT_ID`        | GitHub Actions secret                                            | Same job; identifies the Neon project to call                                                                                                                                                                |
| `DATABASE_URL`           | Vercel env (Production, Preview, Development)                    | the app itself, read by `apps/web/src/db/client.ts`                                                                                                                                                          |
| `DATABASE_RESET_ALLOWED` | GitHub Actions job env (CI only); exported by hand for local use | Required opt-in for `pnpm --filter @feudo/web db:reset` and the `withTestDb` test harness; both refuse to run without it                                                                                     |

Secrets are set once, in this repo, through the GitHub CLI — never pasted into a workflow file or
committed:

```
gh secret set DATABASE_URL_PREVIEW
gh secret set NEON_API_KEY
gh secret set NEON_PROJECT_ID
```

Until the owner adds `DATABASE_URL_PREVIEW`, the `integration` job's "Check preview database
secret" step emits a `::warning::` annotation, skips the rest of the job and exits successfully.
Until `NEON_API_KEY` and `NEON_PROJECT_ID` are both present, `reset-preview` logs which one is
missing and exits successfully. Neither job ever prints a connection string, API key or database
error text.

`gh secret set` prompts for the value on stdin; nothing is echoed and nothing is written to the
repo. `DATABASE_URL_PREVIEW` should be the pooled connection string for the `preview` branch, from
the Neon console or `vercel env pull` once the branch exists. `NEON_API_KEY` is created in the
Neon console under Account Settings → API keys; use the narrowest key available (project-scoped,
or a dedicated Neon account used only for this automation). `NEON_PROJECT_ID` is visible in the
Neon console project settings, or as the `NEON_PROJECT_ID` variable Vercel already injects into
this project.

## What `reset-preview` does once its secrets exist

On every push to `main`, after the `integration` job has finished, `apps/web/scripts/reset-neon-preview.mjs`
calls the Neon API: it looks up the existing `preview` branch by name and restores it from `main`
(`POST /branches/{id}/restore` with `main`'s branch id as the source), then polls the resulting
operation until it reaches a terminal status, failing the job if it does not finish cleanly. It
never creates the `preview` branch — that branch is provisioned once, out of band — and it fails
if `preview` or `main` is missing or ambiguous (more than one branch with that name).

Restoring `preview` from `main` copies whatever is on `main` — including any production personal
data — onto the branch that CI and every preview deployment read from. To keep `preview` free of
production personal data (ADR-0008), the `reset-preview` job runs `pnpm --filter @feudo/web
db:reset` against `DATABASE_URL_PREVIEW` immediately after the restore finishes, in the same job.
`preview` never holds production personal data at rest, only between the restore completing and
the reset step running a few seconds later.

The `integration` and `reset-preview` jobs share a `preview-db` concurrency group with
`cancel-in-progress: false`, so two runs never truncate or restore the shared branch at the same
time; `reset-preview` also `needs: integration`, so a push to `main` always finishes running
integration tests against the pre-restore data before the branch is wiped.

## Resetting the preview branch locally

```
export DATABASE_URL=<preview branch connection string>
export DATABASE_RESET_ALLOWED=preview
pnpm --filter @feudo/web db:migrate   # apply committed migrations
pnpm --filter @feudo/web db:reset     # truncate every table in the public schema
```

`db:reset` (`apps/web/scripts/reset-db.mjs`) and the `withTestDb` test harness
(`apps/web/src/db/test/harness.ts`) share one truncate routine
(`apps/web/src/db/reset.ts`) that truncates every table in the `public` schema with `restart
identity cascade`, using safely quoted identifiers. Both refuse to run — before issuing any query
— unless `DATABASE_RESET_ALLOWED=preview` is set, and both refuse unconditionally when
`VERCEL_ENV=production`. Run them only against `DATABASE_URL_PREVIEW`'s value, never against
production.

## Integration tests

`pnpm test:integration` (root) runs `apps/web`'s Vitest integration project
(`vitest.integration.config.mts`) only when `DATABASE_URL` is set; without it, the script logs a
notice and exits 0 locally, and fails loudly (exit 1) when `CI` is set, since the CI job's own
"Check preview database secret" step is the only place allowed to decide to skip. `pnpm test`
(unit tests, `packages/core` and `apps/web`) never needs a database.

Tests use the `withTestDb` helper (`apps/web/src/db/test/harness.ts`): it truncates every table in
the `public` schema before the test body runs, so each test starts from a known-empty state.
Running it locally requires `DATABASE_RESET_ALLOWED=preview` (see above).

## Health check

`GET /api/health` runs `select 1` against `DATABASE_URL` and returns `{ ok: true, db: true }`, or
status 503 with `{ ok: false, db: false }` if the database is unreachable. The result is memoized
for 10 seconds per warm instance, since the endpoint is public and unauthenticated. It never
returns the connection string or the underlying error. It stores nothing, so it has no entry in
the ADR-0008 data map.
