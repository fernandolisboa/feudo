import Link from "next/link";

import { AuthShell, getCurrentSession } from "@/modules/auth";
import { AcceptInvitationButton, getInvitationPreview, t } from "@/modules/households";

export default async function InviteAcceptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getCurrentSession();
  const next = `/convite/${id}`;

  if (!session) {
    return (
      <AuthShell title={t.inviteAcceptPage.title}>
        <p className="text-sm">{t.inviteAcceptPage.signedOutPrompt}</p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href={`/entrar?next=${encodeURIComponent(next)}`}
            className="text-brand hover:text-brand-hover underline underline-offset-4"
          >
            {t.inviteAcceptPage.signInLink}
          </Link>
          <Link
            href={`/registrar?next=${encodeURIComponent(next)}`}
            className="text-brand hover:text-brand-hover underline underline-offset-4"
          >
            {t.inviteAcceptPage.signUpLink}
          </Link>
        </div>
      </AuthShell>
    );
  }

  const preview = await getInvitationPreview(id, session);

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
