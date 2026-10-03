import { redirect } from "next/navigation";

import { Alert, AlertDescription } from "@/ui/alert";
import {
  AuthShell,
  MagicLinkForm,
  getCurrentSession,
  redirectIfAccountDeletionPending,
  t,
} from "@/modules/auth";

export default async function MagicLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getCurrentSession();
  await redirectIfAccountDeletionPending(session);
  if (session) {
    redirect("/");
  }

  const { error } = await searchParams;

  return (
    <AuthShell title={t.magicLink.title} subtitle={t.magicLink.subtitle}>
      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{t.magicLink.invalidOrExpired}</AlertDescription>
        </Alert>
      ) : null}
      <MagicLinkForm />
    </AuthShell>
  );
}
