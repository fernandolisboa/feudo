# Feudo

Household finances and banking intelligence. A PWA for households that pool their income:
ledger and visibility via Open Finance, emergency-reserve targeting and placement, and a scored
comparison of how well banks fit a household (including how much they lock you in).

Product scope lives in `PRODUCT.md`. Domain truth lives in `CONTEXT.md`, `UBIQUITOUS_LANGUAGE.md`
and `docs/adr/`. Visual truth lives in `DESIGN.md`. When this file and those disagree, those win.

## Context

- Solo project. Owner: `fernandolisboa` on GitHub. No other contributors.
- **Multi-tenant from day one.** The first household is the owner's, but strangers will register,
  connect their own banks and invite their partners. Nothing in schema, queries or copy assumes a
  specific user.
- Self-registration is the product default. `REGISTRATION_MODE=open|invite|closed` is an
  operational switch for private beta, never a design constraint.
- The owner does not read code. Tests and the review pipeline are their eyes. Optimize for
  verifiability, not readability by a human.
- Language: talk to the owner in Portuguese (pt-BR). Think, code, name things, write commits,
  tickets, docs and ADRs in English. User-facing strings ship in pt-BR (see **i18n**).
- Agents do the work end to end: repo, config, CI, deploy. The owner steps in for logins, secrets
  and approvals.
- Usage reality for the first household: ~90% Windows PC, ~6% Android, rest Apple. Out of scope for
  now: native builds, risk investing, options, backtests, billing/plans (design tenant-aware so
  metering is possible later; build nothing for it now).

## Stack (closed)

Single Next.js app, TypeScript end to end. Server-side code lives in Server Actions and Route
Handlers.

- **Framework**: Next.js (App Router) + TypeScript strict. `pnpm` workspace: `apps/web` and
  `packages/core` (pure logic, framework-free).
- **PWA**: web manifest + service worker via Serwist. Offline: read-only cached shell and
  last-known data; writes require network. Web push is a follow-up.
- **UI**: React + Tailwind CSS. **shadcn/ui is mandatory for interactive primitives** (dialog,
  dropdown, select, combobox, popover, tabs, toast, form controls). Never hand-roll these.
  Components are copied into the repo and restyled through `DESIGN.md` tokens. Layout, charts and
  domain components are free.
- **Database**: Postgres on Neon via the Vercel integration, **one project per environment**:
  production stays on its own project; Vercel Preview/Development and CI share a separate free
  `feudo-preview` project, never a branch per deployment (Neon's free-tier branch limit has broken
  CI before). The integration's automatic preview branches stay off; CI drops and recreates the
  preview project's schema and migrates it at the start of each run. CI applies the committed
  migrations to production on every push to `main` (`migrate-production`, GitHub Environment
  `production`); nothing else touches the production project. Drizzle ORM + drizzle-kit
  migrations committed to the repo.
- **Auth & tenancy**: Better Auth with its `organization` plugin (ADR-0001). Email + password with
  verification, magic link, password reset, sessions, rate-limited auth endpoints. **Household** is
  the tenant: roles `owner` (exactly one), `admin` and `member`; a user can belong to several
  households and works in one active household at a time; invite by email (24h expiry),
  leave/transfer ownership. Emails via Resend.
- **Jobs**: Vercel Cron hitting bearer-protected Route Handlers for bank-connection sync (the unit
  of work is the user-owned connection; manual triggers are limited per household, ADR-0005) and
  indicator refresh. No queue or worker until a measured need appears.
- **Data sources**: each user brings their own Meu Pluggy credentials (free personal tier, per
  CPF) through a guided wizard; Feudo syncs per user with that user's credentials and never pools
  CPFs. No Pluggy Connect widget. The provider sits behind a small `DataProvider` interface.
  Pluggy's paid plan (R$ 2,500/month) and a written OK from Pluggy support gate the closed beta
  and public launch (ADR-0005). Bacen SGS API for CDI/Selic/IPCA.
- **AI**: `@anthropic-ai/sdk`, analysis layer only. Sonnet by default; Opus only for the monthly
  deep analysis. Prompts versioned under `prompts/` with fixture tests. Every AI call is attributed
  to a household.
- **Hosting**: Vercel free tier, default `*.vercel.app` domain.
- **Money**: integer centavos + currency code, never floats. Dates in UTC, displayed in the
  household's time zone (default `America/Sao_Paulo`).

Confirm with the owner before creating any paid resource.

## Architecture principles

1. **AI never calculates or invents numbers.** Three strictly separated layers:
   - _Data_: sync jobs (Pluggy, SGS) → normalized tables.
   - _Deterministic_ (`packages/core`, pure TS, no I/O): categorization rules, savings rate,
     average fixed cost, reserve target, per-account real yield, bank scoring.
   - _AI interpretation_: receives computed numbers as structured input, returns analysis with
     explicit trade-offs (liquidity × yield × risk). Persona: conservative analyst; must reference
     the inputs it used; may not recommend a product without stating the counter-argument. Every
     analysis is stored with its inputs, prompt version and model.
2. **Tenant isolation is a hard invariant.** Every domain table declares its scope: household
   (`household_id`) or user (`user_id`, only bank connections and provider credentials); an
   account's `household_id` is nullable only to mean "unassigned" (ADR-0001). Data access goes
   through scoped repositories that take the household or user from the session; no query path
   accepts an unscoped id. Every new table ships with an isolation test (household A cannot read
   or write household B).
3. **LGPD by design**: terms and privacy policy accepted at registration; explicit consent step
   before any bank connection; data minimization; provider credentials encrypted at rest; account
   data export and deletion flows; audit log of access to financial data. These ship before
   registration opens beyond the first household.
4. **Deep modules, thin interfaces**: `auth`, `households`, `sync`, `market-data`, `ledger`,
   `reserve`, `banking-intel`, `analysis`. Each exposes a small entry point; implementation stays
   private. These modules are vertical slices under `apps/web/src/modules/<slice>/` (schema,
   repository, service, actions, components, strings, tests, `index.ts`, per ADR-0011); `app/` is
   routing only (pages, layouts, route handlers), and infrastructure with no domain meaning (the DB
   client and migration tooling, cron auth, the health probe) lives in `apps/web/src/platform/`.
5. **Domain docs are the source of truth**: `CONTEXT.md`, `UBIQUITOUS_LANGUAGE.md`, `docs/adr/`.
   Update them as decisions crystallize, not after.
6. **Validation at the edges**: Zod schemas on every external input (Pluggy payloads, SGS
   responses, AI outputs, forms). Types derive from schemas, never duplicated.
7. **Security**: secrets only in Vercel env; authorization checked on every route and action
   against the session's household; rate limiting on auth, sync and AI endpoints; cron endpoints
   authenticated; `/security-audit` runs before every production deploy.
8. **Design is a gate, not a garnish**: `DESIGN.md` is canonical; every UI ticket passes the
   Impeccable checks before it is done.

## Coding standards

- Pragmatic first: KISS and YAGNI beat cleverness. Build what the ticket asks; no speculative
  abstractions, feature flags or "future-proofing" beyond the tenant model above.
- SOLID where it earns its keep: small single-purpose modules; depend on interfaces only at real
  boundaries (data providers, AI client, email); extend through data (rules, configs), not
  inheritance.
- DRY with judgment: extract on the third occurrence, or when two copies must change together.
  Duplication beats the wrong abstraction.
- **Comments: none by default.** Code says what; names say intent. A comment is allowed only for a
  _why_ that cannot live in code: a security invariant, a numeric edge case, a workaround with a
  link. No JSDoc that restates a signature. No commented-out code.
- Types over docs: Zod at the edges, derived types inside; no `any`; exhaustive `switch` on unions.
- Errors are typed values at boundaries; throw only where unrecoverable.
- Pure functions in `packages/core`; side effects (DB, HTTP, AI, sync, email) at the edges.
- Formatting and lint are machine-enforced (Prettier, ESLint strict, typescript-eslint). Reviewers
  never comment on what a tool enforces.
- Conventional commits, small commits, descriptive PRs. One PR per ticket, squash-merge.

## Testing

- **Unit**: Vitest on `packages/core`. Required for every rule and calculation, with fixtures
  shaped like real Pluggy/SGS data.
- **Property-based**: `fast-check` on money math, reserve target and bank scoring.
- **Isolation**: for every domain table, a test proving a session from household A cannot read,
  write or trigger jobs for household B. Mandatory, blocking.
- **Integration**: Route Handlers + Drizzle against the `feudo-preview` project.
- **E2E**: Playwright against the Vercel preview for the critical paths: registration, email
  verification, login, household invite and join, bank connection against the in-repo fake
  `DataProvider` (Meu Pluggy has no sandbox; the real provider gets a manual smoke test), ledger
  dashboard, reserve view, account deletion.
- Coverage gate on `packages/core` (≥ 90% lines and branches); no gate on UI.
- A ticket is not done without tests that fail before the change and pass after: `/tdd` for domain
  logic, tests-alongside for UI.

## Review pipeline

Every PR runs `/review` (`.claude/commands/review.md`). It launches the reviewers below in
parallel. Each sees only its lens, the diff and the ticket, and returns findings that the
orchestrator merges into one checklist.

| reviewer     | model                    | lens                                                                                                                                                                                                   | blocking                               |
| ------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| correctness  | Opus                     | logic, edge cases, error handling, money math, race conditions                                                                                                                                         | yes                                    |
| security     | Fable 5.1 / Opus         | tenant isolation on every query and action, OWASP, authorization, secrets, injection, data exposure, rate limits, cron/webhook auth, dependency risk, LGPD; runs the security-audit prompt on the diff | yes                                    |
| architecture | Fable 5.1 / Opus         | module boundaries, deep-module test, coupling, YAGNI/KISS violations, ADR conformance                                                                                                                  | yes                                    |
| spec         | Sonnet 5                 | does the change do what the ticket asked                                                                                                                                                               | yes                                    |
| standards    | Sonnet 5                 | coding standards above, naming, comments policy                                                                                                                                                        | fix-forward; blocking only if repeated |
| context      | Sonnet 5                 | consistency with `CONTEXT.md`, glossary, ADRs and git history; flags decisions silently re-made                                                                                                        | advisory                               |
| external     | Codex CLI (`codex exec`) | independent second opinion on correctness                                                                                                                                                              | advisory                               |

Rules: implementer and reviewer are never the same agent. A blocking finding returns the ticket to
the implementer with the finding as an acceptance criterion; the reviewer that raised it re-checks.
Findings are written to the PR.

## Agent routing

The main session is the orchestrator: it plans, delegates, integrates and talks to the owner. It
does not implement tickets itself. Subagents live in `.claude/agents/`.

| agent                       | model                                  | responsibility                                                      |
| --------------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| orchestrator (main session) | Fable 5.1 while quota lasts, else Opus | planning, delegation, integration, talking to the owner             |
| `architect`                 | Fable 5.1 / Opus                       | ADRs, module boundaries, grilling sessions, contract design         |
| `implementer`               | Sonnet 5, bounded thinking             | tickets, TDD loops, migrations                                      |
| `reviewer-correctness`      | Opus                                   | see review pipeline                                                 |
| `reviewer-security`         | Fable 5.1 / Opus                       | see review pipeline                                                 |
| `reviewer-architecture`     | Fable 5.1 / Opus                       | see review pipeline                                                 |
| `reviewer-spec`             | Sonnet 5                               | see review pipeline                                                 |
| `reviewer-standards`        | Sonnet 5                               | see review pipeline                                                 |
| `reviewer-context`          | Sonnet 5                               | see review pipeline                                                 |
| `ui-critic`                 | Sonnet 5                               | Impeccable critique/fix loop on UI tickets                          |
| `scribe`                    | Haiku 4.5                              | docs formatting, changelog, commit messages, i18n translation pass  |
| `researcher`                | Haiku 4.5                              | documentation lookup (Context7), API exploration, dependency checks |

Rules: pick the cheapest model that reliably does the task; escalate one tier only on failure and
say so. Prefer several small focused subagents over one long-running one. Log which agents handled
each ticket in the PR description.

## Design workflow

- `PRODUCT.md` + `DESIGN.md` exist before any UI is written. `/design` is used for the core screens
  and any new screen type, not for every ticket.
- Every UI ticket: implement → `npx impeccable detect` (must be clean) → `/impeccable critique` by
  the `ui-critic` agent → fix → repeat until the critique has no blocking findings.
- `/impeccable audit` belongs to the owner. Never run it for them.

## Design system tokens

Canonical values live in `DESIGN.md`; this is the summary `/design` and `/design-sync` read.

- Direction: calm, trustworthy household ledger; paper surfaces, serif for headlines and money,
  hairlines not shadows, one accent used sparingly.
- Structure (not themeable): collapsible sidebar (224px / 64px), bottom tabs under 768px; page =
  overline + serif headline + hairline sections; stat tiles, bar lists, 40px table rows.
- Themes (per-user, `data-theme`, ADR-0010): `caderno` (default) · `painel` · `sala`. Tokens:
  `--bg --surface --surface-2 --line --line-soft --ink --muted --accent --accent-hover
--accent-soft --chart-1 --chart-2 --warning --danger --font-display --font-body --font-mono
--radius --elevation --density`.
- Caderno: bg `#f4efe6`, surface `#fbf8f2`, ink `#2a2622`, muted `#6f675d`, accent `#4f6f52`,
  chart `#3d8756` / `#6a63c9`, Source Serif 4 + Source Sans 3, radius 6px, body 14px.
- Type scale: 11 · 12 · 13 · body · 15 · 18 · 22 · 26 · 30 · 34; tabular numerals always.
- Spacing 4px base; motion 150ms hover, 200ms shell; `prefers-reduced-motion` respected.
- Formatting: `R$ 1.234,56`, `4,6%`, `02/09/2026`, `agosto de 2026`, household time zone.

## i18n

Source strings in English (`en`); pt-BR is the shipped locale. Every ticket that adds strings ends
with a `/better-portuguese` pass on the new pt-BR strings: natural, not literal. Currency, dates and
numbers follow Brazilian conventions.

## Working agreements

- Ask before: paid resources (including Pluggy beyond the free tier), deleting data, force pushes,
  anything that touches bank consents.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, the Impeccable detect pass and `/review` must be
  green before any PR.
- Full `/security-audit` (repo-wide) after any ticket touching auth, tenancy or data access, before
  `REGISTRATION_MODE=open`, and monthly as a floor.
- Product uncertainty → ask the owner. Technical uncertainty → one-paragraph ADR draft, then ask.
- Secrets: the owner pastes app secrets into Vercel env. CI-only secrets (the preview project's
  database URL) live in GitHub Actions secrets, set via `gh secret set`. Never store either in the
  repo or in memory.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues, operated through the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage labels, unchanged (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`); security findings add `security` + `severity:<level>`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` plus `docs/adr/` at the repo root (`UBIQUITOUS_LANGUAGE.md` sits alongside). See `docs/agents/domain.md`.
