import { redirect } from "next/navigation";

import { AuthShell } from "@/modules/auth/components/auth-shell";
import { SignInForm } from "@/modules/auth/components/sign-in-form";
import { getCurrentSession } from "@/modules/auth/session";
import { authStrings } from "@/modules/auth/strings";

export default async function SignInPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/");
  }

  const t = authStrings.ptBR.signIn;

  return (
    <AuthShell title={t.title} subtitle={t.subtitle}>
      <SignInForm />
    </AuthShell>
  );
}
