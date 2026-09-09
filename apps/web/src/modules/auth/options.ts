import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import type { Database } from "@/db/client";
import { getEmailSender } from "./email/select";

const VERIFICATION_EXPIRES_IN_SECONDS = 60 * 60;

export function buildAuthOptions(db: Database): BetterAuthOptions {
  return {
    database: drizzleAdapter(db, { provider: "pg" }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      expiresIn: VERIFICATION_EXPIRES_IN_SECONDS,
      sendVerificationEmail: async ({ user, url }) => {
        await getEmailSender().send({
          to: user.email,
          subject: "Confirme seu e-mail no Feudo",
          text: `Olá, ${user.name}. Confirme seu e-mail para começar a usar o Feudo: ${url}`,
          html: `<p>Olá, ${user.name}.</p><p>Confirme seu e-mail para começar a usar o Feudo:</p><p><a href="${url}">${url}</a></p>`,
        });
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
    },
    plugins: [nextCookies()],
  };
}
