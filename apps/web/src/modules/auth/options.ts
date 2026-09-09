import type { BetterAuthOptions } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { evaluateRegistrationMode } from "@feudo/core";

import type { Database } from "@/db/client";
import { buildVerificationEmail } from "./email/verification-email";
import { getEmailSender } from "./email/select";
import { readAuthBaseUrl, readRegistrationMode } from "./env";
import { TERMS_VERSION } from "./terms";

const VERIFICATION_EXPIRES_IN_SECONDS = 60 * 60;

function readTermsVersion(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const value = (body as Record<string, unknown>).termsVersion;
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
      // eslint-disable-next-line @typescript-eslint/require-await -- Better Auth's middleware type requires an async handler even though this hook never awaits.
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-up/email") {
          return;
        }

        const registrationDecision = evaluateRegistrationMode(readRegistrationMode(env), false);
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
    plugins: [nextCookies()],
  } satisfies BetterAuthOptions;
}
