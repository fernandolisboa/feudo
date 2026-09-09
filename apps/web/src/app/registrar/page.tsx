import { redirect } from "next/navigation";

import { AuthShell } from "@/modules/auth/components/auth-shell";
import { SignUpForm } from "@/modules/auth/components/sign-up-form";
import { getCurrentSession } from "@/modules/auth/session";
import { authStrings } from "@/modules/auth/strings";

export default async function SignUpPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/");
  }

  const t = authStrings.ptBR.signUp;

  return (
    <AuthShell title={t.title} subtitle={t.subtitle}>
      <SignUpForm />
    </AuthShell>
  );
}
