import { redirect } from "next/navigation";

import { AuthShell, SignUpForm, getCurrentSession, t } from "@/modules/auth";

export default async function SignUpPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/");
  }

  return (
    <AuthShell title={t.signUp.title} subtitle={t.signUp.subtitle}>
      <SignUpForm />
    </AuthShell>
  );
}
