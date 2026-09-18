---
status: accepted
date: 2026-09-18
---

# The app is organised as vertical slices inside one Next.js deployable

The owner found the tree hard to read: the HTTP surface (`app/api/*`) sits inside `apps/web`, which reads as "the frontend", while domain code is spread over `modules/`, `lib/`, `db/schema/` and route folders. The stack decision (CLAUDE.md, "Stack (closed)") keeps one Next.js app with Server Actions and Route Handlers as the only server-side surface, so a physically separate backend is not on the table: it would double deploys, lose Server Actions, and put Better Auth's cookies across two origins for no product gain. Legibility is therefore solved by slicing, not by splitting the deployable.

The current tree is already two thirds of the way there: `modules/auth`, `modules/households` and `modules/theme` each own their actions, service, repository, components, strings and tests behind an `index.ts`. What breaks the pattern is the remainder: `market-data` lives in `lib/`, every slice's tables live in `db/schema/`, the app shell lives in `components/`, the health probe and the daily-cron orchestration live inside `app/api/`, and nothing enforces that a slice is entered only through its `index.ts`.

## Decision

One deployable, `apps/web`, organised as **vertical slices**. A slice is one folder under `apps/web/src/modules/<slice>/` that owns everything about one capability, from table to pixel:

```
apps/web/src/
  app/                     Next.js routing only: pages, layouts, route handlers.
                           A file here wires a URL to a slice; it holds no logic.
  modules/
    <slice>/
      index.ts             the only import path other code may use
      schema.ts            Drizzle tables the slice owns (scope column per ADR-0001)
      repository.ts        scoped queries
      service.ts           use cases
      actions.ts           Server Actions ("use server")
      handlers.ts          Route Handler bodies, when the slice has an HTTP surface
      components/          React for this slice
      strings.ts           pt-BR copy
      *.test.ts            unit, *.integration.test.ts against feudo-preview
      test/                fixtures and helpers other slices may import for tests
  platform/                infrastructure with no domain meaning: db client and
                           migration tooling, cron auth, email transport, env
  ui/                      shadcn primitives and layout atoms (page header, section header)
  lib/                     tiny pure helpers with no domain (interpolate, format-date, cn)
```

The slice list is the module list already fixed in CLAUDE.md: `auth`, `households`, `sync`, `market-data`, `ledger`, `reserve`, `banking-intel`, `analysis`, plus two app-level slices, `shell` (navigation, sidebar, tab bar, user menu) and `theme`. Cross-cutting jobs compose slices rather than owning logic: the daily cron handler calls one exported step per slice.

`packages/core/src/<slice>/` keeps the deterministic layer (architecture principle 1) and mirrors the slice names, so a reader finds the maths for `reserve` in `packages/core/src/reserve` and everything else about it in `apps/web/src/modules/reserve`.

Boundaries are enforced by lint, not convention:

- code outside a slice imports it only via `@/modules/<slice>` (its `index.ts`); the only exception is `@/modules/<slice>/test/*` from test files;
- `app/**` imports only from `@/modules/*`, `@/ui/*` and `@/platform/*`;
- `modules/**` never imports from `@/app/*`;
- `drizzle.config.ts` reads `./src/modules/*/schema.ts`; `platform/db/schema.ts` re-exports them for the client and for migrations.

## Alternatives considered

- **Slices as workspace packages** (`packages/auth`, `packages/households`, …, with `apps/web` holding only routes). Makes the split visible at the top of the repo but costs a `tsconfig`, `vitest.config` and lint config per package, `transpilePackages` in Next for the React parts, and a workspace publish step for every change. The lint boundary above gives the same guarantee at zero ceremony; revisit if a second deployable ever appears.
- **A separate `apps/api`** (Hono or Fastify). Contradicts the closed stack, doubles hosting and CI, and turns every Server Action into a fetch with CORS and cookie forwarding. Rejected.
- **Keep the current layout and document it.** Cheapest, but leaves `market-data` in `lib/`, schema outside the slices and no enforcement, which is exactly what made the tree hard to read.

## Consequences

- Moves, no behaviour change: `lib/market-data` → `modules/market-data`; `db/schema/{auth,households,market-data,fake-sent-emails}.ts` → the owning slice's `schema.ts`; `components/app-shell` → `modules/shell`; `app/api/health/probe.ts` → `modules/platform-health` or `platform/health`; the cron step wrappers in `app/api/cron/daily/route.ts` → each slice exports its step and the route only composes; `db/{client,reset*,migrations-status,pool-error-logger}` → `platform/db`; `lib/cron-auth` and `lib/timing-safe-token` → `platform/`; `components/ui` and `components/{page,section}-header` → `ui/`.
- `modules/households/strings.ts` currently imports `@/modules/auth/strings` directly; the shared strings move to the `auth` index or to `households`.
- `apps/web/e2e/`, `apps/web/drizzle/` and `apps/web/scripts/` stay where they are: Playwright and drizzle-kit expect them at the app root.
- Every new slice ships with `index.ts`, `schema.ts` when it owns tables, and an isolation test (ADR-0001, ADR-0008). The reviewer-architecture lens checks the boundaries; ESLint blocks the imports.
- Docs that cite paths (`docs/runbooks/*.md`, `CLAUDE.md` architecture principle 4) are updated in the same PR as the move.
