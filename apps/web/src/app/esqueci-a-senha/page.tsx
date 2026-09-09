import { redirect } from "next/navigation";

import { AuthShell, ForgotPasswordForm, getCurrentSession, t } from "@/modules/auth";

export default async function ForgotPasswordPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/");
  }

  return (
    <AuthShell title={t.forgotPassword.title} subtitle={t.forgotPassword.subtitle}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
