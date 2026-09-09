import Link from "next/link";

import { AuthShell, ResetPasswordForm, t } from "@/modules/auth";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell
      title={t.resetPassword.title}
      subtitle={token ? t.resetPassword.subtitle : undefined}
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <>
          <p className="text-sm">{t.resetPassword.invalidOrExpired}</p>
          <p className="mt-4 text-sm">
            <Link href="/esqueci-a-senha" className="text-foreground underline underline-offset-4">
              {t.resetPassword.requestNewLink}
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
