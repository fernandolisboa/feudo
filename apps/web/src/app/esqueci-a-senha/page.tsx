import { redirect } from "next/navigation";

import {
  AuthShell,
  ForgotPasswordForm,
  getCurrentSession,
  redirectIfAccountDeletionPending,
  t,
} from "@/modules/auth";

export default async function ForgotPasswordPage() {
  const session = await getCurrentSession();
  await redirectIfAccountDeletionPending(session);
  if (session) {
    redirect("/");
  }

  return (
    <AuthShell title={t.forgotPassword.title} subtitle={t.forgotPassword.subtitle}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
