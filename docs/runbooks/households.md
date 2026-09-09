# Households runbook

The `households` module (`apps/web/src/modules/households`) owns household creation, the active
household on a session, switching between households and `household_settings` (name lives on
Better Auth's `organization` row; time zone and reserve multiple live here, ADR-0001). Its public
surface is `apps/web/src/modules/households/index.ts`, exporting only what has a real consumer
today: the two components (`HouseholdSwitcher`, `OnboardingForm`), the routing helpers
(`resolveAppRoute`, `resolveOnboardingRoute`, `requireHouseholdSession`), `t`, the scope types
(`HouseholdScope`, `householdScope`, `NoActiveHouseholdError`) and a read-only settings accessor
(`getHouseholdSettings`). `service.ts`, `repository.ts`, `actions.ts`, `validation.ts` and
`scope.ts`'s `scopeForNewHousehold` are module-private; components import them by relative path,
not through the barrel. The module depends on `auth` (`getAuth`, `CurrentSession`) one way only —
`auth` never imports from `households` (see docs/runbooks/auth.md for how the invite-mode
sign-up check stays inside `auth` for exactly this reason).

## Scoped repositories

Every household-scoped table gets a repository built by a `createXRepository(scope)` factory that
closes over a `HouseholdScope` (`{ householdId: string }`) at construction time — no method takes a
household id as a parameter (`households/repository.ts` is the template: `get`, `create`,
`update`, all scoped, `update` a no-op on an empty patch). `householdScope` only ever builds a
scope from a full `CurrentSession` (`auth.getCurrentSession()`'s return type), not from a bare id,
so a scope can only be constructed from a real, already-resolved session in production code.
`scopeForNewHousehold(id)` is the one deliberate exception: `households.createHousehold` needs a
scope for the household it just created, before the session reflects it as active, and this
module's own tests use it to seed households directly (`households/test/with-two-households.ts`).

### Isolation-test template

`households/test/with-two-households.ts` seeds two households, each with its own settings row, and
hands a test both scopes (`withTwoHouseholds(async ({ db, householdA, householdB }) => {...})`).
Every household-scoped table's isolation test reuses this shape: read household A's row through
household A's scope and assert it matches, write through household A's scope and assert household
B's row is unchanged. `households/repository.integration.test.ts` is the reference instance.

## Active household resolution

A session's `activeOrganizationId` (Better Auth's field name; Feudo's household id) is only ever a
hint, never trusted as-is. `auth.getCurrentSession()` re-validates it against the `member` table on
every read and falls back to the user's most recently joined household when it is missing (a fresh
sign-in — Better Auth does not populate it on its own) or stale (the membership was revoked, or the
household was deleted, since it was last set); the fallback is persisted back onto the session row
directly through Drizzle, not through Better Auth's `setActiveOrganization` API, so this can safely
run during a Server Component render (it never touches Next's `cookies()`). This is what makes a
second sign-in land back in the same household instead of re-onboarding, and what stops a removed
member's still-valid session cookie from resolving to a household it no longer belongs to.

Two `organizationHooks` in `auth/options.ts` back this up by clearing the DB-stored
`activeOrganizationId` proactively, so any code path that reads `session.session.activeOrganizationId`
directly (bypassing `getCurrentSession`'s re-validation — Better Auth's own `getFullOrganization`,
for one) is not further behind than one write: `afterRemoveMember` nulls it for the removed user's
sessions pointed at that household, `afterDeleteOrganization` nulls it for every session pointed at
the deleted household.

`requireHouseholdSession()` (`households/require-household-session.ts`) wraps
`getCurrentSession()` + `resolveAppRoute` and redirects to `/entrar` or `/comecar` itself; call it
from every `(app)` page and action that needs the active household, not just from the `(app)`
layout. The layout's own redirect is a UX nicety (nothing renders even for an instant before the
redirect fires) — it is not the security boundary. A page or action that only relied on the layout
would still be safe today (Next.js always runs the layout), but nothing enforces that a future
route keeps a layout above it, so each page checks for itself.

## Household creation

`households.createHousehold` (`service.ts`) refuses outright when the session already has an
active household (`already_has_household`) — creating a second household happens through a future
invite-accept flow (#11) or an explicit switch, never implicitly by calling create again. On
success it calls Better Auth's `createOrganization` with `keepCurrentActiveOrganization: true`
(so the new household is not yet active), writes `household_settings` with the caller's input, and
only then calls `setActiveOrganization` — in that order, so a household is never the active one
while its settings are still missing or defaulted. If the settings write or the
`setActiveOrganization` call fails, the organization is deleted to avoid leaving an orphaned
household behind.

A default `household_settings` row (`America/Sao_Paulo`, 6 months) is also written by
`organizationHooks.afterCreateOrganization` in `auth/options.ts`, independent of `createHousehold`,
so a household created through any other path (a raw call to `/organization/create`) can never be
observed without one; `createHousehold` immediately overwrites it with the caller's chosen values.
`beforeCreateOrganization` in the same file rejects a `logo` or `metadata` on the create call —
Feudo never uses either field on `organization`.

## Single-owner enforcement

Better Auth's `organization` plugin allows several owners; Feudo does not (ADR-0001). Two lines of
defense, both in `auth/options.ts` and `db/schema/auth.ts`: `organizationHooks.beforeUpdateMemberRole`
rejects any role update to `owner` outright (ownership transfer needs a dedicated action, not yet
built — #11), and a partial unique index, `member_single_owner_uidx` on
`member (organization_id) where role = 'owner'`, makes a second owner row impossible at the
database level even if that hook is ever bypassed.

## Time zone validation

`households/validation.ts`'s `createHouseholdFormSchema` validates `timeZone` against
`Intl.supportedValuesOf("timeZone")` (the runtime's own IANA database) rather than an
`options`-heavy schema; `OnboardingForm` renders the same list as a shadcn `Select`, defaulting to
`America/Sao_Paulo`.

## Expired invitations

Nothing purges expired `invitation` rows yet — `hasPendingInvitation` (`auth/invitations.ts`)
already filters them out of every read by `expiresAt`, so they are inert, not a security gap. A
cleanup job (or `ON DELETE` via a scheduled sweep) arrives with #11 alongside the rest of the
invite-accept flow.
