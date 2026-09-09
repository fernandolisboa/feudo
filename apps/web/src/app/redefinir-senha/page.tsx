import { AuthShell, ResetPasswordFlow, t } from "@/modules/auth";

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
      <ResetPasswordFlow token={token} />
    </AuthShell>
  );
}
