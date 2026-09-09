# Database runbook

Feudo runs Postgres on Neon through the Vercel marketplace integration. There is exactly one
non-production branch: `preview`. Every CI run and every Vercel preview deployment talks to it.
The Neon–Vercel integration's automatic per-deployment branching stays off (Free-tier branch
limits have broken CI on other projects); a branch per preview deployment is never created.

## Branches

| branch    | used by                                    | reset                                                                                                   |
| --------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `main`    | Production Vercel deployments              | never                                                                                                   |
| `preview` | CI (`integration` job) and Vercel previews | data truncated at the start of each CI run; the branch itself is restored from `main` after every merge |

## Secrets

| secret                 | where                                         | used by                                                                                            |
| ---------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `DATABASE_URL_PREVIEW` | GitHub Actions secret                         | CI `integration` job: migrates the `preview` branch, resets its data, runs `pnpm test:integration` |
| `NEON_API_KEY`         | GitHub Actions secret                         | CI `reset-preview` job: restores the `preview` branch from `main` after every push to `main`       |
| `NEON_PROJECT_ID`      | GitHub Actions secret                         | Same job; identifies the Neon project to call                                                      |
| `DATABASE_URL`         | Vercel env (Production, Preview, Development) | the app itself, read by `apps/web/src/db/client.ts`                                                |

Until the owner adds `DATABASE_URL_PREVIEW`, the `integration` job logs a notice and exits
successfully without running anything against a database. Until `NEON_API_KEY` and
`NEON_PROJECT_ID` are both present, `reset-preview` logs which one is missing and exits
successfully. Neither job ever prints a connection string, API key or database error text.

To add them:

```
gh secret set DATABASE_URL_PREVIEW
gh secret set NEON_API_KEY
gh secret set NEON_PROJECT_ID
```

`gh secret set` prompts for the value on stdin; nothing is echoed and nothing is written to the
repo. `DATABASE_URL_PREVIEW` should be the pooled connection string for the `preview` branch, from
the Neon console or `vercel env pull` once the branch exists. `NEON_API_KEY` is created in the
Neon console under Account Settings → API keys. `NEON_PROJECT_ID` is visible in the Neon console
project settings, or as the `NEON_PROJECT_ID` variable Vercel already injects into this project.

## What `reset-preview` does once its secrets exist

On every push to `main`, `apps/web/scripts/reset-neon-preview.mjs` calls the Neon API: it looks up
the `preview` branch by name and restores it from `main` (`POST
/branches/{id}/restore` with `main`'s branch id as the source), or creates it if it does not exist
yet. This keeps `preview` a clean copy of production schema and reference data, never a
long-lived, drifting branch.

## Resetting the preview branch locally

```
export DATABASE_URL=<preview branch connection string>
pnpm --filter @feudo/web db:migrate   # apply committed migrations
pnpm --filter @feudo/web db:reset     # truncate every table in the public schema
```

`db:reset` (`apps/web/scripts/reset-db.mjs`) truncates every table in the `public` schema with
`restart identity cascade`; it never touches `main`. Run it against `DATABASE_URL_PREVIEW`'s
value, never against production.

## Integration tests

`pnpm test:integration` (root) runs `apps/web`'s Vitest integration project
(`vitest.integration.config.mts`) only when `DATABASE_URL` is set; without it, the script logs a
notice and exits 0. `pnpm test` (unit tests, `packages/core` and `apps/web`) never needs a
database.

Tests use the `withTestDb` helper (`apps/web/src/db/test/harness.ts`): it truncates every table in
the `public` schema before the test body runs, so each test starts from a known-empty state.

## Health check

`GET /api/health` runs `select 1` against `DATABASE_URL` and returns `{ ok: true, db: true }`, or
status 503 with `{ ok: false, db: false }` if the database is unreachable. It never returns the
connection string or the underlying error. It stores nothing, so it has no entry in the ADR-0008
data map.
