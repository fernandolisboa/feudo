# Households runbook

The `households` module (`apps/web/src/modules/households`) owns household creation, the active
household on a session, switching between households, invites, roles, removing/leaving members,
ownership transfer and `household_settings` (name lives on Better Auth's `organization` row; time
zone and reserve multiple live here, ADR-0001). Its public surface is
`apps/web/src/modules/households/index.ts`, exporting only what has a real consumer today:

- Components: `HouseholdSwitcherSelect`, `OnboardingForm`, `OnboardingInvitesPanel`,
  `InviteMemberDialog`, `MembersTable`, `PendingInvitationsTable`, `AcceptInvitationButton`.
- Page-level data assembly (`page-props.ts`): `getCasaPageProps` (members, viewer role, whether
  the viewer can manage the household, pending invitations and the household's time zone, all in
  one call for `/casa`), `getOnboardingInvites` (`/comecar`'s "Tenho um convite" tab) and
  `getInvitationPreview` (`/convite/[id]`, wrapping `membership.ts`'s own function of the same name
  with the request headers and database connection a Server Component page never threads through
  itself).
- Routing and session helpers: `resolveAppRoute`, `resolveOnboardingRoute`,
  `requireHouseholdSession`, `getHouseholdSwitcherProps`.
- `t`, the scope types (`HouseholdScope`, `householdScope`, `NoActiveHouseholdError`), a read-only
  settings accessor (`getHouseholdSettings`) and the daily housekeeping entry point
  (`pruneExpiredInvitations`). The role and invitation types (`HouseholdRole`, `PendingInvitation`,
  `InvitationForUser`, `CasaPageProps`) stay off the barrel: every consumer is inside this module
  and imports them by relative path straight from `membership.ts`/`page-props.ts`.

Every `(app)`/`comecar`/`convite` route imports only from this barrel, never by relative path into
the module's internals. `service.ts`, `membership.ts`, `repository.ts`, `actions.ts`,
`validation.ts` and `scope.ts`'s `scopeForNewHousehold` are module-private; only this module's own
components and `page-props.ts` import them by relative path. The module depends on `auth`
(`getAuth`, `CurrentSession`) one way only — `auth` never imports from `households` (see
docs/runbooks/auth.md for how the invite-mode sign-up check stays inside `auth` for exactly this
reason).

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

Better Auth's `organization` plugin allows several owners; Feudo does not (ADR-0001). Three lines of
defense in total; the first two live in `auth/options.ts` and `db/schema/auth.ts`:
`organizationHooks.beforeUpdateMemberRole`
rejects any role update to `owner` outright and `organizationHooks.beforeCreateInvitation` rejects
any invitation with role `owner` outright (and any invitation carrying more than one role — an
array or a comma-joined string — since `membership.ts` stores and reads back a single role per
member) — ownership only ever moves through `households.transferOwnership` (`membership.ts`),
which bypasses both endpoints and instead updates the two `member` rows directly through Drizzle,
inside one database transaction that locks every member row of the household with
`select … for update` before re-reading the current owner and the target from that locked read (not
from a read taken before the transaction started): a concurrent removal or leave of the target
between the original check and the write can only ever complete before or after this transaction,
never in the middle of it, so it is re-observed as "member not found" rather than silently leaving
the household ownerless. Both updates assert exactly one row changed (`returning(...).length === 1`)
and roll back otherwise. Demote runs before promote — that order never leaves a moment with two
owner rows for the partial unique index below to reject. The index itself,
`member_single_owner_uidx` on `member (organization_id) where role = 'owner'`, makes a second
owner row impossible at the database level even if either hook is ever bypassed.
`households.leaveHousehold`'s own last-member check for an owner locks the same member rows the
same way before counting them, so a concurrent join can never slip in between the count and the
household delete that follows it.

A third line of defense lives in Postgres itself: `member_single_owner_trigger`
(`drizzle/0007_single_owner_trigger.sql`), a `DEFERRABLE INITIALLY DEFERRED` constraint trigger on
`member` that asserts, at commit, that every organization with at least one member has exactly one
owner. The partial unique index above only ever rejects a _second_ owner row; it never catches a
_zero_-owner state, which is exactly what Better Auth's raw `/organization/leave` and
`/organization/remove-member` endpoints can produce even with everything above in place: both read
the target member's role with a plain, unlocked `SELECT` and only take a row lock on the `DELETE`
that follows, so a concurrent `transferOwnership` that promotes that same member and commits in the
gap between that read and that delete leaves the delete removing the household's new (and only)
owner — `transferOwnership`'s own `for update` lock protects its own transaction, not a caller
outside it. The trigger catches this at the database level regardless of which code path produced
it, deferred to commit so a transaction that legitimately passes through a zero- or two-owner
moment on its way to a valid final state (transferOwnership's demote-then-promote, for one) is
judged only on that final state.

`0007_single_owner_trigger.sql` opens with a `DO $$ … $$` pre-check, before the trigger function is
even created, that fails the migration outright if any existing household already has zero or more
than one owner — installing the trigger onto data that already violates it would otherwise lock out
every future write to that household's `member` rows, including the fix itself. **Recovery**: if
that pre-check fails, find the offending household (its id is in the error message), inspect its
`member` rows, and promote the oldest `admin` to `owner` by hand (a single `UPDATE … SET role =
'owner'` — households.transferOwnership needs an existing owner to run and cannot fix a household
that has none), then re-run the migration. A household with two owners (only reachable by a manual
edit predating the partial unique index) is fixed the same way in reverse: demote all but one.

Not yet implemented (#26): when a user deletion cascades to an owner's `member` row, the succession
(promoting the oldest admin, or oldest member if no admin exists, per ADR-0001) must run in the same
transaction as that deletion, promoting before the owner's row is removed — the trigger is deferred
to commit, so it judges only the transaction's final state, but a transaction that deletes the sole
owner without ever promoting a successor still ends that state with zero owners and is rejected.

## Invites, roles, removing, leaving and ownership transfer

`membership.ts` (module-private) wraps the `organization` plugin's invitation and member endpoints
for the household vocabulary and adds two operations the plugin does not have (ownership transfer,
and "the last member leaving deletes the household"):

- **Invite** (`inviteMember`): owner or admin only (plugin's default `memberAc`/`adminAc`/`ownerAc`
  permissions, unchanged); role is `admin` or `member` only, enforced by
  `households/validation.ts`'s `inviteMemberFormSchema` at the edge and by
  `beforeCreateInvitation` server-side. `organization({ sendInvitationEmail })` in `auth/options.ts`
  sends the email through the same `EmailSender` as every other auth email
  (`auth/email/invitation-email.ts`), linking to `/convite/:id`. Rate-limited two ways:
  `auth.api.createInvitation` never traverses Better Auth's own limiter (`auth.api.*` calls skip
  `onRequest`, see docs/runbooks/auth.md), so `inviteMember` counts the inviter's own `invitation`
  rows created (or last sent — see Resend below) in the last hour and refuses above 20
  (`rate_limited`) before ever calling the plugin; a raw call to `POST /organization/invite-member`
  additionally gets its own `rateLimit.customRules` entry (`auth/options.ts`, 60s/5) since that path
  does go through Better Auth's own limiter. `organization({ invitationLimit: 10 })` caps pending
  invitations per household on top of both. A send failure is not silently dropped:
  `sendInvitationEmail` (`auth/options.ts`) wraps the `EmailSender` call in its own try/catch —
  Better Auth's `runInBackgroundOrAwait` only logs a rejection here and still returns the
  already-created invitation as success — and sets `invitation.last_sent_at` (nullable timestamp,
  added by `0008_invitation_delivery_failed_at.sql`) to the current time on every send attempt from
  that row, initial or resend alike, success or failure; `invitation.delivery_failed_at` (same
  migration) is set on failure and cleared on the next attempt that succeeds.
- **Resend** (`resendInvitation`): `PendingInvitationsTable` (`/casa`) shows "e-mail não enviado" on
  a row with `delivery_failed_at` set, with a **Resend** action (`resendInvitationAction` →
  `households.resendInvitation`) that looks up the invitation's own email and role from the
  household-scoped row (never from client input — the resend can only ever resend an invitation
  that already exists, never mint one under a different identity). Eligibility (`status = 'pending'`
  and `delivery_failed_at IS NOT NULL`) is required directly in the scoped select, not just checked
  in code, so a healthy or cancelled invitation is `not_found` before any rate check runs. Subject to
  three limits: the same per-inviter hourly ceiling as a fresh invite (`recentInvitationCount`, which
  now counts a row recent by either `created_at` or `last_sent_at` — Better Auth's own `resend: true`
  only ever bumps `expires_at`, never `created_at`, so counting by `created_at` alone would let an
  invitation age out of the ceiling and then be resent indefinitely); a 60-second minimum interval
  since the invitation's own `last_sent_at`; and a re-check of `status = 'pending'` immediately
  before calling `auth.api.createInvitation`, closing the window for a concurrent cancel between the
  first read and the call. After the call, if a different invitation row now exists pending for the
  same e-mail (Better Auth's own resend path looks up the target by e-mail, not id, in
  `crud-invites.mjs` — a genuine race past the "already invited" guard could otherwise touch the
  wrong row), that stray row is cancelled and the outcome is `not_found` rather than a false `ok`.
  `delivery_failed_at` is re-read after the call and reported as `failed` if the resend's own send
  attempt failed too.
- **Cancel** (`cancelInvitation`) and **list** (`listPendingInvitations`,
  `listMyPendingInvitations`) read and write the plugin's own `invitation` table; every call is
  scoped by the session's household (`session.householdId`) or, for `listMyPendingInvitations`
  (onboarding's "Tenho um convite" panel), by the session's own email — never by a client-supplied
  organization id. `listPendingInvitations` is one household-scoped Drizzle select against
  `invitation` directly (`status = 'pending'`, `expires_at` in the future), not Better Auth's own
  `listInvitations` joined in memory against a second query for `delivery_failed_at`/`last_sent_at`
  — that endpoint doesn't return Feudo's own columns anyway, so reading the table once is both
  necessary and simpler; it takes no `requestHeaders` as a result. `listMyPendingInvitations` still
  filters to `status = 'pending'` and `expires_at` in the future, independently of the daily prune
  below. `beforeCancelInvitation` (`auth/options.ts`) refuses to cancel an invitation that already
  moved past "pending" (accepted or rejected), so `cancelInvitation` reports `not_found` instead of
  silently overwriting a settled invitation's status to "canceled". The raw
  `GET /organization/list-invitations` and `GET /organization/get-full-organization` endpoints only
  check that the caller is _a_ member of the organization, not their role (Better Auth 1.7.3's
  `crud-invites.mjs` and `adapter.mjs`'s `findFullOrganization`, which joins in `invitation: true`),
  and no `organizationHooks` entry point exists for either — a plain member could otherwise read
  every pending invitee's email through either one. `auth/options.ts`'s global `hooks.before` (the
  same mechanism that already guards `/update-user` and `/sign-up/email`) matches both paths, each
  resolving its own target organization the same way the underlying endpoint does (query
  `organizationId`, or — `get-full-organization` only — query `organizationSlug` first, resolved to
  an id via `organization.slug`; falling back to the session's active household either way, `||` not
  `??` so an empty-string query value still falls through instead of short-circuiting the guard), then
  hands that id to one shared helper, `requireInvitationReadRole(ctx, organizationId)`, which looks
  up the caller's own `member` row there and rejects with `FORBIDDEN` unless their role — parsed as
  Better Auth's comma-separated string — contains `owner` or `admin`. `GET /organization/list-members`
  is deliberately left open to every member: only invitee emails are restricted, not the household's
  own roster.
- **Accept** (`acceptInvitation`) takes a signed-in `CurrentSession`, not a `HouseholdSession`: a
  user with no household yet is exactly who needs to call it. Better Auth verifies the invitation's
  email matches the session's own email, that it is still pending and unexpired, and sets the
  joined household active on that session. **Preview** (`getInvitationPreview`, wrapped by
  `page-props.ts` for `/convite/[id]`) shows the same result even after the inviter themselves has
  left the household in the meantime (`INVITER_IS_NO_LONGER_A_MEMBER_OF_THE_ORGANIZATION`): the
  invitation's own validity was already confirmed before that check runs, and `acceptInvitation`
  never re-checks the inviter's membership, so the preview reads the household name and role
  directly instead of reporting a false "not found".
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
  member leaves" case product wants. `MemberRowActions` (`components/member-row-actions.tsx`)
  reaches this path from the UI too: the leave action is offered to the owner precisely when they
  are also the household's only member (`isSelf && (!isOwnerRow || isLastMember)`), and
  `LeaveHouseholdDialog` shows the "this deletes the household" copy in that case. A non-owner
  leaving calls `leaveOrganization` and then clears the user's other sessions' stale
  `activeOrganizationId` itself (see "Active household resolution" above).
- **Transfer ownership** (`transferOwnership`): owner only, one database transaction, described
  above.

## Expired and cancelled invitations

`households.pruneExpiredInvitations` (`invitation-prune.ts`, exported from the barrel) deletes
every `invitation` row that is `status = 'canceled'` or `status = 'pending'` with `expires_at` in
the past (ADR-0008); accepted and rejected rows are left alone. `households.runDailyPruneStep`, in
the same file, wraps it in a try/catch and runs as the second step of the shared housekeeping cron,
`GET /api/cron/daily` (`apps/web/src/app/api/cron/daily/route.ts`), next to `market-data`'s
`runDailyRefreshStep` and `auth`'s `runDailyPruneStep` — see "Cron jobs" in `docs/runbooks/auth.md`.

## Time zone validation

`households/validation.ts`'s `createHouseholdFormSchema` validates `timeZone` against
`Intl.supportedValuesOf("timeZone")` (the runtime's own IANA database) rather than an
`options`-heavy schema; `OnboardingForm` renders the same list as a shadcn `Select`, defaulting to
`America/Sao_Paulo`.

`getCasaPageProps` reads the household's own `timeZone` from `household_settings` and hands it to
both `MembersTable` and `PendingInvitationsTable`, which format the "since"/"expires" columns with
`lib/format-date.ts`'s `formatShortDate(date, timeZone)` (`Intl.DateTimeFormat("pt-BR", {
dateStyle: "short", timeZone })`) instead of the server's own UTC — Vercel's server clock and a
household's `America/Sao_Paulo` default disagree by a whole calendar day around midnight otherwise,
and formatting without an explicit time zone risks a client/server hydration mismatch besides.
