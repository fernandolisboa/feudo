import { AuthShell, ResetPasswordFlow, t } from "@/modules/auth";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell title={t.resetPassword.title}>
      <ResetPasswordFlow token={token} />
    </AuthShell>
  );
}
