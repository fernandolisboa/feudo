import type { BetterAuthOptions } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { evaluateRegistrationMode } from "@feudo/core";

import type { Database } from "@/db/client";
// Imported from the households module's leaf file, not its entry point:
// households/index.ts re-exports service.ts, which imports getAuth from this
// module, so importing the entry point here would be a require cycle.
import { hasPendingInvitation } from "@/modules/households/invitations";
import { buildVerificationEmail } from "./email/verification-email";
import { getEmailSender } from "./email/select";
import { readAuthBaseUrl, readRegistrationMode } from "./env";
import { TERMS_VERSION } from "./terms";

const VERIFICATION_EXPIRES_IN_SECONDS = 60 * 60;
const INVITATION_EXPIRES_IN_SECONDS = 60 * 60 * 24;

function readTermsVersion(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const value = (body as Record<string, unknown>).termsVersion;
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
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      expiresIn: VERIFICATION_EXPIRES_IN_SECONDS,
      sendVerificationEmail: async ({ user, url }) => {
        const email = buildVerificationEmail(user.name, url);
        await emailSender.send({ to: user.email, ...email });
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/update-user") {
          // Consent fields are input:true/write-once at sign-up (docs/adr/0008); a
          // signed-in session must never be able to rewrite its own consent record.
          if (hasConsentField(ctx.body)) {
            throw new APIError("BAD_REQUEST", { message: "consent_fields_immutable" });
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
    },
    plugins: [
      organization({
        // 24h, overriding the plugin's 48h default (ADR-0001). Owner is the
        // default creatorRole and owner/admin/member are the plugin's default
        // roles, so no ac/roles override is needed to match household vocabulary.
        invitationExpiresIn: INVITATION_EXPIRES_IN_SECONDS,
      }),
      nextCookies(),
    ],
  } satisfies BetterAuthOptions;
}
