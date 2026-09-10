import type { BetterAuthOptions } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink, organization } from "better-auth/plugins";
import { and, count, eq, like } from "drizzle-orm";
import { evaluateRegistrationMode } from "@feudo/core";

import { householdSettings, member, session as sessionTable } from "@/db/schema";

import type { Database } from "@/db/client";
import { verification } from "@/db/schema/auth";
import { clearActiveHouseholdOnSessions } from "./clear-active-household";
import { buildInvitationEmail } from "./email/invitation-email";
import { buildMagicLinkEmail } from "./email/magic-link-email";
import { buildResetPasswordEmail } from "./email/reset-password-email";
import { buildVerificationEmail } from "./email/verification-email";
import { getEmailSender } from "./email/select";
import { readAuthBaseUrl, readRegistrationMode } from "./env";
import { hasPendingInvitation } from "./invitations";
import { TERMS_VERSION } from "./terms";
import { markTimingFloorRequestStart, waitForTimingFloor } from "./timing-floor";
import {
  describeExpiryPtBR,
  INVITATION_EXPIRES_IN_SECONDS,
  MAGIC_LINK_EXPIRES_IN_SECONDS,
  RESET_PASSWORD_EXPIRES_IN_SECONDS,
  VERIFICATION_EXPIRES_IN_SECONDS,
} from "./token-expiry";

// A household is a small pool of people, not an org chart: 20 households per
// user is already generous headroom and keeps a compromised account from
// spraying orgs.
const ORGANIZATION_LIMIT = 20;
// Mirrors households/validation.ts's DEFAULT_TIME_ZONE/DEFAULT_RESERVE_MULTIPLE.
// Duplicated as literals, not imported: auth must never depend on households
// (docs/adr/0001), and this is the fallback the raw /organization/create
// endpoint gets if it is ever called outside households.createHousehold,
// which immediately overwrites it with the caller's chosen values.
const FALLBACK_HOUSEHOLD_TIME_ZONE = "America/Sao_Paulo";
const FALLBACK_HOUSEHOLD_RESERVE_MULTIPLE = 6;
const OWNER_ROLE = "owner";
// Mirrors households/validation.ts's/auth/validation.ts's own 120-char
// bound at the edge (Zod) — this is the server-side floor for a raw call
// that skips the app's forms entirely.
const MAX_NAME_LENGTH = 120;
// A household is a small pool of people, not a mailing list (see
// inviteMember's INVITE_HOURLY_LIMIT in households/membership.ts, the
// per-inviter check): this is the plugin's own ceiling on pending
// invitations per household.
const INVITATION_LIMIT = 10;

function readTermsVersion(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const value = (body as Record<string, unknown>).termsVersion;
  return typeof value === "string" ? value : undefined;
}

function readName(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const value = (body as Record<string, unknown>).name;
  return typeof value === "string" ? value : undefined;
}

const CONSENT_FIELDS = ["termsVersion", "termsAcceptedAt"] as const;

function hasConsentField(body: unknown): boolean {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const keys = Object.keys(body);
  return CONSENT_FIELDS.some((field) => keys.includes(field));
}

function readEmail(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const value = (body as Record<string, unknown>).email;
  return typeof value === "string" ? value : undefined;
}

function logMagicLinkSendFailure(error: unknown): void {
  console.error(
    "magic-link email send failed",
    error instanceof Error ? error.name : "UnknownError",
  );
}

const RESET_PASSWORD_VERIFICATION_PREFIX = "reset-password:";

async function deleteOtherPasswordResetTokens(db: Database, userId: string): Promise<void> {
  await db
    .delete(verification)
    .where(
      and(
        eq(verification.value, userId),
        like(verification.identifier, `${RESET_PASSWORD_VERIFICATION_PREFIX}%`),
      ),
    );
}

export function buildAuthOptions(db: Database, env: NodeJS.ProcessEnv = process.env) {
  const baseURL = readAuthBaseUrl(env);
  // Built eagerly, not inside sendVerificationEmail below: Better Auth swallows
  // that callback's rejection into a logged "background task" failure and still
  // reports the request ok (docs/runbooks/auth.md), so a misconfigured provider
  // must throw here, while buildAuthOptions runs, to actually fail the request.
  const emailSender = getEmailSender(env);

  return {
    database: drizzleAdapter(db, { provider: "pg" }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL,
    trustedOrigins: [baseURL],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: RESET_PASSWORD_EXPIRES_IN_SECONDS,
      sendResetPassword: async ({ user, url }) => {
        const email = buildResetPasswordEmail(
          url,
          describeExpiryPtBR(RESET_PASSWORD_EXPIRES_IN_SECONDS),
        );
        await emailSender.send({ to: user.email, ...email });
      },
      // The token just consumed to reach this callback is already gone
      // (consumeVerificationValue deletes it); any other outstanding
      // reset-password token for the same user is still live and would
      // otherwise let a stale link set yet another password later.
      onPasswordReset: async ({ user }) => {
        await deleteOtherPasswordResetTokens(db, user.id);
      },
    },
    user: {
      additionalFields: {
        termsVersion: {
          type: "string",
          required: true,
          input: true,
        },
        termsAcceptedAt: {
          type: "date",
          required: true,
          input: false,
          defaultValue: () => new Date(),
        },
        theme: {
          type: "string",
          required: false,
          input: false,
          // Literal, not modules/theme's DEFAULT_THEME: auth must not
          // import theme at runtime (modules/theme owns theme validity).
          defaultValue: "caderno",
        },
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      expiresIn: VERIFICATION_EXPIRES_IN_SECONDS,
      sendVerificationEmail: async ({ user, url }) => {
        const email = buildVerificationEmail(url);
        await emailSender.send({ to: user.email, ...email });
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      // Magic-link sign-in and the reset-password submission fall outside
      // Better Auth's own default special rules (magic link defaults to
      // 60s/5 via the plugin; reset submission isn't listed at all), so we
      // align the sign-in family's 10s/3 strictness on the ones a bot could
      // spam. `/magic-link/verify` and `/reset-password/*` are the GET links
      // an email client re-opens (link previews, double-clicks) and their
      // tokens are single-use anyway, so they get a looser ceiling: a 429 on
      // a GET a real user's browser navigates to would surface as raw JSON
      // instead of the app's error page (no route handler intercepts it).
      customRules: {
        "/sign-in/magic-link": { window: 10, max: 3 },
        "/magic-link/verify": { window: 10, max: 20 },
        "/reset-password": { window: 10, max: 3 },
        "/reset-password/*": { window: 10, max: 20 },
        // auth.api.createInvitation (households.inviteMember) never
        // traverses this limiter — only a direct HTTP call to the raw
        // endpoint does — so this is a second, independent ceiling next to
        // inviteMember's own per-inviter database count, not a replacement
        // for it.
        "/organization/invite-member": { window: 60, max: 5 },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        markTimingFloorRequestStart(ctx.path, ctx.context);

        if (ctx.path === "/update-user") {
          // Consent fields are input:true/write-once at sign-up (docs/adr/0008); a
          // signed-in session must never be able to rewrite its own consent record.
          if (hasConsentField(ctx.body)) {
            throw new APIError("BAD_REQUEST", { message: "consent_fields_immutable" });
          }
          const updatedName = readName(ctx.body);
          if (updatedName !== undefined && updatedName.length > MAX_NAME_LENGTH) {
            throw new APIError("BAD_REQUEST", { message: "name_too_long" });
          }
          return;
        }

        if (ctx.path !== "/sign-up/email") {
          return;
        }

        const mode = readRegistrationMode(env);
        const email = readEmail(ctx.body);
        const hasPendingInvite =
          mode === "invite" && email !== undefined ? await hasPendingInvitation(db, email) : false;

        const registrationDecision = evaluateRegistrationMode(mode, hasPendingInvite);
        if (!registrationDecision.allowed) {
          throw new APIError("FORBIDDEN", { message: registrationDecision.reason });
        }

        const name = readName(ctx.body);
        if (name !== undefined && name.length > MAX_NAME_LENGTH) {
          throw new APIError("BAD_REQUEST", { message: "name_too_long" });
        }

        if (readTermsVersion(ctx.body) !== TERMS_VERSION) {
          throw new APIError("BAD_REQUEST", { message: "terms_not_accepted" });
        }

        // termsAcceptedAt is input:false, but Better Auth's sign-up body schema
        // passes unknown keys through unchanged, so a client-sent value still
        // reaches parseInputData and either overrides the field's defaultValue
        // function with itself (unset) or throws (update). Stripping it here is
        // what actually forces the server-clock defaultValue to run.
        if (ctx.body && typeof ctx.body === "object") {
          delete (ctx.body as Record<string, unknown>).termsAcceptedAt;
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        await waitForTimingFloor(ctx.path, ctx.context);
      }),
    },
    plugins: [
      organization({
        // 24h, overriding the plugin's 48h default (ADR-0001). Owner is the
        // default creatorRole and owner/admin/member are the plugin's default
        // roles, so no ac/roles override is needed to match household vocabulary.
        invitationExpiresIn: INVITATION_EXPIRES_IN_SECONDS,
        organizationLimit: ORGANIZATION_LIMIT,
        invitationLimit: INVITATION_LIMIT,
        requireEmailVerificationOnInvitation: true,
        sendInvitationEmail: async ({ id, email, role, organization, inviter }) => {
          const invitationEmail = buildInvitationEmail({
            url: `${baseURL}/convite/${id}`,
            householdName: organization.name,
            inviterName: inviter.user.name,
            role,
            expiresIn: describeExpiryPtBR(INVITATION_EXPIRES_IN_SECONDS),
          });
          await emailSender.send({ to: email, ...invitationEmail });
        },
        organizationHooks: {
          beforeCreateOrganization: ({ organization }) => {
            if (organization.logo || organization.metadata) {
              throw new APIError("BAD_REQUEST", { message: "logo_and_metadata_not_supported" });
            }
            return Promise.resolve();
          },
          // Mirrors beforeCreateOrganization: Feudo never uses logo or
          // metadata on organization, on create or update (data minimization).
          beforeUpdateOrganization: ({ organization }) => {
            if (organization.logo || organization.metadata) {
              throw new APIError("BAD_REQUEST", { message: "logo_and_metadata_not_supported" });
            }
            return Promise.resolve();
          },
          // Safety net for any organization created outside
          // households.createHousehold (e.g. a direct call to the raw
          // endpoint): guarantees every household has a settings row, so no
          // caller can observe a household with none. createHousehold
          // immediately overwrites this default with the caller's input.
          afterCreateOrganization: async ({ organization }) => {
            await db
              .insert(householdSettings)
              .values({
                householdId: organization.id,
                timeZone: FALLBACK_HOUSEHOLD_TIME_ZONE,
                reserveMultiple: FALLBACK_HOUSEHOLD_RESERVE_MULTIPLE,
              })
              .onConflictDoNothing();
          },
          // Owner never transfers through this generic endpoint (ADR-0001):
          // ownership only moves through households.transferOwnership, a
          // dedicated action that promotes and demotes in one database
          // transaction, bypassing this hook entirely. The partial unique
          // index on member (organization_id) where role = 'owner' is the
          // second, DB-level line of defense.
          beforeUpdateMemberRole: ({ newRole }) => {
            const roles = Array.isArray(newRole) ? newRole : [newRole];
            if (roles.includes(OWNER_ROLE)) {
              throw new APIError("FORBIDDEN", { message: "owner_role_not_transferable" });
            }
            return Promise.resolve();
          },
          // Mirrors beforeUpdateMemberRole: nobody is ever invited as owner
          // (ADR-0001) — a household always has exactly one, established at
          // creation and moved only through households.transferOwnership.
          // households/membership.ts stores and reads back a single role per
          // member, so a multi-role invitation (an array, or a comma-joined
          // string once Better Auth's own parseRoles has run) is rejected
          // outright rather than silently keeping only the first role.
          beforeCreateInvitation: ({ invitation }) => {
            // Typed as a plain string, but Better Auth's own parseRoles
            // already comma-joins an array body before this hook runs, and
            // nothing stops a raw caller from sending one directly — the
            // array check is defensive against either.
            const role = invitation.role as string | string[];
            if (Array.isArray(role) || role.includes(",")) {
              throw new APIError("BAD_REQUEST", { message: "multiple_roles_not_allowed" });
            }
            if (role === OWNER_ROLE) {
              throw new APIError("FORBIDDEN", { message: "owner_role_not_invitable" });
            }
            return Promise.resolve();
          },
          // households.cancelInvitation reports the truth for an invitation
          // that already moved past "pending" (accepted or rejected) instead
          // of silently overwriting its status to "canceled" and reporting
          // success for an action that changed nothing meaningful.
          beforeCancelInvitation: ({ invitation }) => {
            if (invitation.status !== "pending") {
              throw new APIError("BAD_REQUEST", { message: "invitation_not_pending" });
            }
            return Promise.resolve();
          },
          // Second line of defense behind households.leaveHousehold's own
          // last-member check: a raw call to /organization/delete must never
          // erase a household that still has other members in it, even if
          // that check is ever bypassed.
          beforeDeleteOrganization: async ({ organization }) => {
            const [row] = await db
              .select({ total: count() })
              .from(member)
              .where(eq(member.organizationId, organization.id));
            if ((row?.total ?? 0) > 1) {
              throw new APIError("BAD_REQUEST", { message: "household_has_other_members" });
            }
          },
          // A removed member's existing sessions must stop scoping data to
          // the household they were removed from, immediately, not just on
          // their next getCurrentSession() re-validation.
          afterRemoveMember: async ({ user, organization }) => {
            await clearActiveHouseholdOnSessions(db, user.id, organization.id);
          },
          afterDeleteOrganization: async ({ organization }) => {
            await db
              .update(sessionTable)
              .set({ activeOrganizationId: null })
              .where(eq(sessionTable.activeOrganizationId, organization.id));
          },
        },
      }),
      magicLink({
        // Sign-up policy (REGISTRATION_MODE, terms acceptance) is enforced
        // only on /sign-up/email's hooks.before; letting magic link mint new
        // accounts would bypass both. It only ever signs in an existing user.
        disableSignUp: true,
        storeToken: "hashed",
        expiresIn: MAGIC_LINK_EXPIRES_IN_SECONDS,
        sendMagicLink: async ({ email, url }, ctx) => {
          // Better Auth always mints and stores the token before calling
          // this, regardless of whether the email exists; only the send
          // itself is gated here, so requesting a link for a stranger's
          // address never turns Feudo into an unauthenticated mailer for
          // that inbox (quota, deliverability reputation).
          const existing = await ctx?.context.internalAdapter.findUserByEmail(email);
          if (!existing) {
            return;
          }
          const magicLinkEmail = buildMagicLinkEmail(
            url,
            describeExpiryPtBR(MAGIC_LINK_EXPIRES_IN_SECONDS),
          );
          try {
            await emailSender.send({ to: email, ...magicLinkEmail });
          } catch (error) {
            // A provider failure for a known address must not surface as a
            // fast, non-`APIError` 500 — that would skip the timing-floor
            // after-hook and let a caller tell known and unknown addresses
            // apart by status code alone.
            logMagicLinkSendFailure(error);
          }
        },
      }),
      nextCookies(),
    ],
  } satisfies BetterAuthOptions;
}
