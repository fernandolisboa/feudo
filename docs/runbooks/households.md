# Households runbook

The `households` module (`apps/web/src/modules/households`) owns household creation, the active
household on a session, switching between households, invites, roles, removing/leaving members,
ownership transfer and `household_settings` (name lives on Better Auth's `organization` row; time
zone and reserve multiple live here, ADR-0001). Its public surface is
`apps/web/src/modules/households/index.ts`, exporting only what has a real consumer today: the two
components (`HouseholdSwitcher`, `OnboardingForm`), the routing helpers (`resolveAppRoute`,
`resolveOnboardingRoute`, `requireHouseholdSession`), `t`, the scope types (`HouseholdScope`,
`householdScope`, `NoActiveHouseholdError`), a read-only settings accessor
(`getHouseholdSettings`) and the daily housekeeping entry point
(`pruneExpiredInvitations`). `service.ts`, `membership.ts`, `repository.ts`, `actions.ts`,
`validation.ts` and `scope.ts`'s `scopeForNewHousehold` are module-private; components import them
by relative path, not through the barrel. The module depends on `auth` (`getAuth`,
`CurrentSession`) one way only — `auth` never imports from `households` (see docs/runbooks/auth.md
for how the invite-mode sign-up check stays inside `auth` for exactly this reason).

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
the deleted household. `/organization/leave` runs no `organizationHooks`, so
`households.leaveHousehold` (`membership.ts`) clears the same user's other sessions' stale
`activeOrganizationId` itself, directly through Drizzle, right after a successful
`getAuth().api.leaveOrganization` call, mirroring what `afterRemoveMember` does for a removed
member.

`requireHouseholdSession()` (`households/require-household-session.ts`) wraps
`getCurrentSession()` + `resolveAppRoute` and redirects to `/entrar` or `/comecar` itself; call it
from every `(app)` page and action that needs the active household, not just from the `(app)`
layout. The layout's own redirect is a UX nicety (nothing renders even for an instant before the
redirect fires) — it is not the security boundary. A page or action that only relied on the layout
would still be safe today (Next.js always runs the layout), but nothing enforces that a future
route keeps a layout above it, so each page checks for itself.

## Household creation

`households.createHousehold` (`service.ts`) refuses outright when the session already has an
active household (`already_has_household`) — landing in a second household happens through
`households.acceptInvitation` (`membership.ts`) or an explicit switch, never implicitly by calling
create again. On success it calls Better Auth's `createOrganization` with `keepCurrentActiveOrganization: true`
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
rejects any role update to `owner` outright and `organizationHooks.beforeCreateInvitation` rejects
any invitation with role `owner` outright — ownership only ever moves through
`households.transferOwnership` (`membership.ts`), which bypasses both endpoints and instead
updates the two `member` rows directly through Drizzle inside one database transaction (demote the
current owner to admin, then promote the target to owner — that order never leaves a moment with
two owner rows for the partial unique index below to reject). The index itself,
`member_single_owner_uidx` on `member (organization_id) where role = 'owner'`, makes a second
owner row impossible at the database level even if either hook is ever bypassed.

## Invites, roles, removing, leaving and ownership transfer

`membership.ts` (module-private) wraps the `organization` plugin's invitation and member endpoints
for the household vocabulary and adds two operations the plugin does not have (ownership transfer,
and "the last member leaving deletes the household"):

- **Invite** (`inviteMember`): owner or admin only (plugin's default `memberAc`/`adminAc`/`ownerAc`
  permissions, unchanged); role is `admin` or `member` only, enforced by
  `households/validation.ts`'s `inviteMemberFormSchema` at the edge and by
  `beforeCreateInvitation` server-side. `organization({ sendInvitationEmail })` in `auth/options.ts`
  sends the email through the same `EmailSender` as every other auth email
  (`auth/email/invitation-email.ts`), linking to `/convite/:id`.
- **Cancel** (`cancelInvitation`) and **list** (`listPendingInvitations`,
  `listMyPendingInvitations`) read and write the plugin's own `invitation` table; every call is
  scoped by the session's household (`session.householdId`) or, for `listMyPendingInvitations`
  (onboarding's "Tenho um convite" panel), by the session's own email — never by a client-supplied
  organization id.
- **Accept** (`acceptInvitation`) takes a signed-in `CurrentSession`, not a `HouseholdSession`: a
  user with no household yet is exactly who needs to call it. Better Auth verifies the invitation's
  email matches the session's own email and sets the joined household active on that session.
- **Remove** (`removeMember`): owner or admin only, never the owner (the plugin's own
  `removeMember` endpoint already refuses removing the sole owner — Feudo always has exactly one —
  and the household-A/household-B isolation the endpoint gives for free is exercised by
  `membership.integration.test.ts`'s cross-household describe block).
- **Change role** (`updateMemberRole`): owner or admin only, `admin` ↔ `member` only — the
  single-owner enforcement above blocks any attempt to route through it to `owner`.
- **Leave** (`leaveHousehold`): refuses an owner with other members present
  (`owner_must_transfer_first`); an owner who is the household's only member instead deletes the
  household (`getAuth().api.deleteOrganization`) rather than calling `leaveOrganization`, which the
  plugin itself would refuse ("cannot leave as the only owner") even though it is the exact "last
  member leaves" case product wants. A non-owner leaving calls `leaveOrganization` and then clears
  the user's other sessions' stale `activeOrganizationId` itself (see "Active household resolution"
  above).
- **Transfer ownership** (`transferOwnership`): owner only, one database transaction, described
  above.

## Expired and cancelled invitations

`households.pruneExpiredInvitations` (`invitation-prune.ts`, exported from the barrel) deletes
every `invitation` row that is `status = 'canceled'` or `status = 'pending'` with `expires_at` in
the past (ADR-0008); accepted and rejected rows are left alone. It runs as a third step of the
shared housekeeping cron, `GET /api/cron/daily` (`apps/web/src/app/api/cron/daily/route.ts`), next
to `refreshMarketData` and `pruneExpiredVerifications` — see "Cron jobs" in `docs/runbooks/auth.md`.

## Time zone validation

`households/validation.ts`'s `createHouseholdFormSchema` validates `timeZone` against
`Intl.supportedValuesOf("timeZone")` (the runtime's own IANA database) rather than an
`options`-heavy schema; `OnboardingForm` renders the same list as a shadcn `Select`, defaulting to
`America/Sao_Paulo`.
