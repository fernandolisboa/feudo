import Link from "next/link";

import { AuthShell, ResendVerificationForm, sanitizeNextPath, t } from "@/modules/auth";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email, next } = await searchParams;
  const nextPath = sanitizeNextPath(next);

  return (
    <AuthShell title={t.verifyEmail.title}>
      {email ? (
        <>
          <p className="text-sm">{t.verifyEmail.body.replace("{email}", email)}</p>
          <div className="mt-4">
            <ResendVerificationForm email={email} next={nextPath} />
          </div>
        </>
      ) : (
        <>
          <p className="text-sm">{t.verifyEmail.bodyMissingEmail}</p>
          <p className="mt-4 text-sm">
            <Link
              href="/entrar"
              className="text-brand hover:text-brand-hover underline underline-offset-4"
            >
              {t.verifyEmail.backToSignIn}
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
