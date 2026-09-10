import { headers } from "next/headers";
import Link from "next/link";

import { AuthShell, getCurrentSession } from "@/modules/auth";
import { AcceptInvitationButton } from "@/modules/households/components/accept-invitation-button";
import { getInvitationPreview } from "@/modules/households/membership";
import { t } from "@/modules/households/strings";

export default async function InviteAcceptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getCurrentSession();

  if (!session) {
    return (
      <AuthShell title={t.inviteAcceptPage.title}>
        <p className="text-sm">{t.inviteAcceptPage.signedOutPrompt}</p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href="/entrar"
            className="text-brand hover:text-brand-hover underline underline-offset-4"
          >
            {t.inviteAcceptPage.signInLink}
          </Link>
          <Link
            href="/registrar"
            className="text-brand hover:text-brand-hover underline underline-offset-4"
          >
            {t.inviteAcceptPage.signUpLink}
          </Link>
        </div>
      </AuthShell>
    );
  }

  const requestHeaders = await headers();
  const preview = await getInvitationPreview(id, session, requestHeaders);

  if (preview.status !== "ok") {
    const message =
      preview.status === "wrong_email"
        ? t.inviteAcceptPage.wrongEmail
        : t.inviteAcceptPage.notFound;
    return (
      <AuthShell title={t.inviteAcceptPage.title}>
        <p className="text-sm">{message}</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t.inviteAcceptPage.title}>
      <p className="text-sm">
        {t.inviteAcceptPage.description
          .replace("{householdName}", preview.householdName)
          .replace("{role}", t.casa.roles[preview.role])}
      </p>
      <div className="mt-4">
        <AcceptInvitationButton invitationId={id} />
      </div>
    </AuthShell>
  );
}
