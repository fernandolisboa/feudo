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
                           migration tooling, cron auth, health probe
  ui/                      shadcn primitives and layout atoms (page header, section header)
  lib/                     tiny pure helpers with no domain (interpolate, format-date, cn)
```

The slice list is the module list already fixed in CLAUDE.md: `auth`, `households`, `sync`, `market-data`, `ledger`, `reserve`, `banking-intel`, `analysis`, plus two app-level slices, `shell` (navigation, sidebar, tab bar, user menu, guided tours; amended 2026-10-01, #95) and `theme`. Cross-cutting jobs compose slices rather than owning logic: the daily cron handler calls one exported step per slice.

`packages/core/src/<slice>/` keeps the deterministic layer (architecture principle 1) and mirrors the slice names, so a reader finds the maths for `reserve` in `packages/core/src/reserve` and everything else about it in `apps/web/src/modules/reserve`.

Boundaries are enforced by lint, not convention (`no-restricted-imports` and `no-restricted-syntax` in `apps/web/eslint.config.mjs`, since #63):

- code outside a slice imports it only via `@/modules/<slice>` (its `index.ts`) or `@/modules/<slice>/schema` (its Drizzle tables, for foreign keys and joins); inside `schema.ts` files the cross-slice reference is a relative `.ts` import (`../auth/schema.ts`) because drizzle-kit and the database reset scripts load the schema graph under plain Node, which has no path aliases; the only other exception is `@/modules/<slice>/test/*` from test files;
- `app/**` imports only from `@/modules/*`, `@/ui/*`, `@/platform/*` and `@/lib/*`;
- `modules/**`, `platform/**`, `ui/**` and `lib/**` never import from `app/`, and `app/**` never imports from `app/` either: a route file wires a URL to a slice and shares nothing;
- `ui/**` and `lib/**` never import from `modules/**` or `platform/**`;
- `platform/db/schema.ts` re-exports every slice's `schema.ts` and `drizzle.config.ts` reads that file; a new slice with tables registers its `schema.ts` there.

## Alternatives considered

- **Slices as workspace packages** (`packages/auth`, `packages/households`, …, with `apps/web` holding only routes). Makes the split visible at the top of the repo but costs a `tsconfig`, `vitest.config` and lint config per package, `transpilePackages` in Next for the React parts, and a workspace publish step for every change. The lint boundary above gives the same guarantee at zero ceremony; revisit if a second deployable ever appears.
- **A separate `apps/api`** (Hono or Fastify). Contradicts the closed stack, doubles hosting and CI, and turns every Server Action into a fetch with CORS and cookie forwarding. Rejected.
- **Keep the current layout and document it.** Cheapest, but leaves `market-data` in `lib/`, schema outside the slices and no enforcement, which is exactly what made the tree hard to read.

## Consequences

- Moves, no behaviour change: `lib/market-data` → `modules/market-data`; `db/schema/{auth,households,market-data,fake-sent-emails}.ts` → the owning slice's `schema.ts`; `components/app-shell` → `modules/shell`; `app/api/health/probe.ts` → `platform/health`; the cron step wrappers in `app/api/cron/daily/route.ts` → each slice exports its step and the route only composes; `db/{client,reset*,migrations-status,pool-error-logger}` → `platform/db`; `lib/cron-auth` and `lib/timing-safe-token` → `platform/`; `components/ui` and `components/{page,section}-header` → `ui/`.
- `modules/households/strings.ts` currently imports `@/modules/auth/strings` directly; the shared strings move to the `auth` index or to `households`.
- `apps/web/e2e/`, `apps/web/drizzle/` and `apps/web/scripts/` stay where they are: Playwright and drizzle-kit expect them at the app root.
- Every new slice ships with `index.ts`, `schema.ts` when it owns tables, and an isolation test (ADR-0001, ADR-0008). The reviewer-architecture lens checks the boundaries; ESLint blocks the imports.
- Docs that cite paths (`docs/runbooks/*.md`, `CLAUDE.md` architecture principle 4) are updated in the same PR as the move.

## Amendment 2026-10-01 (#94): a third app-level slice, `guide`

The "Como usar" page (`/como-usar`) is static help copy that describes every other slice without owning any of their data, so it lives in its own app-level slice, `guide`, next to `shell` and `theme`, instead of inflating `shell` (navigation only). It exports the page component and the anchors other slices deep-link to (the connect-bank wizard links to `#meu-pluggy`); a unit test checks that every "Ir para" link still resolves to a route under `app/(app)/`.

## Amendment 2026-10-01 (#95): `shell` owns the guided tours

The per-screen guided tour is part of the app frame, like the user menu that reopens it, so it lives in `shell` instead of a new slice: the overlay and its provider, the `user_tour` table with `user.tours_auto_start` (user-scoped, ADR-0001), and the server actions that record outcomes. The tour definitions (id, version, screen, steps and their copy) sit in one registry, `shell/tours.ts`, rather than in each screen's slice. The server validates a recorded tour id and stamps the tour's current version from that registry, and `shell` must not import domain slices to collect it. Owning slices only mark their elements with `data-tour="<tour>.<step>"` and keep a rendered test that every step's target exists on their screen, importing the registry through `@/modules/shell/test/tours`. A new tour (Reserva, Bancos) is added to the registry, never to the owning slice.

## Amendment 2026-10-03 (#26): a `privacy` slice for the account-level LGPD flows

Deleting an account touches `auth` (the user row, sessions), `households` (succession, households that go with their last member) and `sync` (credentials, connections, the data each household loses), and it belongs to none of them. It lives in its own domain slice, `privacy`, which owns `user.deletion_requested_at`, the `/exclusao-agendada` page's components, the deletion emails and the daily `purgeAccounts` step, and composes the other slices only through their public entry points: `households.planMembershipDepartures`, `households.releaseMembershipsForAccountPurge` and `households.timeZoneForDepartingUser`; `sync.describeHouseholdDataLoss`, `sync.destroyProviderCredentials` and `sync.deleteConnectionsForAccountPurge`; and from `auth`, `revokeUserSessions`, the pending-deletion session reads (`getPendingAccountDeletion`, `redirectIfAccountDeletionPending`, `ACCOUNT_DELETION_PENDING_ROUTE`) and its transactional email (`getEmailSender`, `renderEmail`, `readAuthBaseUrl`). `auth` owns transactional email for now; when a third slice sends email it moves to `platform/email`. Household deletion stays in `households`, which already owns the household's lifecycle. Export (#25) is the natural next tenant of this slice.

## Amendment 2026-10-03 (#27): a new slice, `audit`

Unlike `shell` and `guide`, the access log does not belong to an existing slice: it owns one table, `financial_data_access` (household- and user-scoped, ADR-0001, ADR-0008), and its public entry points are `recordFinancialDataAccess(session, kind)` — called by `ledger`'s overview, transactions and categories page-props and `reserve`'s page-props, each only after its own read has already succeeded, and by the account-data export this ticket's #25 adds next — the Casa page's "Seus acessos recentes" section, and `runDailyPruneStep`, composed into `GET /api/cron/daily` like every other slice's step. Putting the log in `households` (the Casa page's own slice) would make it depend on `ledger` and `reserve`'s read paths to know what a "kind" means; putting it in `ledger` or `reserve` would make either depend on the other just to log the other's reads. A cross-cutting concern written to by several slices earns its own slice rather than picking a reluctant owner among them, the same reasoning that keeps `market-data` and `analysis` separate from the slices that consume them.
