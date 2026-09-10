import { redirect } from "next/navigation";

import { AuthShell, SignInForm, getCurrentSession, sanitizeNextPath, t } from "@/modules/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = sanitizeNextPath(next);

  const session = await getCurrentSession();
  if (session) {
    redirect(nextPath ?? "/");
  }

  return (
    <AuthShell title={t.signIn.title} subtitle={t.signIn.subtitle}>
      <SignInForm next={nextPath} />
    </AuthShell>
  );
}
