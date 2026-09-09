import { redirect } from "next/navigation";

import { AuthShell, SignInForm, getCurrentSession, t } from "@/modules/auth";

export default async function SignInPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/");
  }

  return (
    <AuthShell title={t.signIn.title} subtitle={t.signIn.subtitle}>
      <SignInForm />
    </AuthShell>
  );
}
