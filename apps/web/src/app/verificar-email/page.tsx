import Link from "next/link";

import { AuthShell, ResendVerificationForm, t } from "@/modules/auth";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <AuthShell title={t.verifyEmail.title}>
      {email ? (
        <>
          <p className="text-sm">{t.verifyEmail.body.replace("{email}", email)}</p>
          <div className="mt-4">
            <ResendVerificationForm email={email} />
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
