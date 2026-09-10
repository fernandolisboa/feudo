import { redirect } from "next/navigation";

import { AuthShell, SignUpForm, getCurrentSession, sanitizeNextPath, t } from "@/modules/auth";

export default async function SignUpPage({
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
    <AuthShell title={t.signUp.title} subtitle={t.signUp.subtitle}>
      <SignUpForm next={nextPath} />
    </AuthShell>
  );
}
