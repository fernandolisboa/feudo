import { redirect } from "next/navigation";

import { interpolate } from "@/lib/interpolate";
import {
  AcceptTermsForm,
  getCurrentSession,
  hasAcceptedCurrentTerms,
  redirectIfAccountDeletionPending,
  t,
  TERMS_VERSION,
} from "@/modules/auth";
import {
  DeleteAccountSection,
  ExportDataSection,
  getDeleteAccountSectionProps,
  t as privacyT,
} from "@/modules/privacy";

export default async function AcceptTermsPage() {
  const session = await getCurrentSession();
  await redirectIfAccountDeletionPending(session);
  if (!session) {
    redirect("/entrar");
  }
  if (hasAcceptedCurrentTerms(session)) {
    redirect("/");
  }

  const deleteAccount = await getDeleteAccountSectionProps(session);

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <span className="font-heading text-foreground text-lg">Feudo</span>
      <div className="border-border bg-card w-full max-w-sm rounded-lg border p-6">
        <h1 className="font-heading text-foreground text-[34px]">{t.acceptTerms.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.acceptTerms.body}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          {interpolate(t.acceptTerms.version, "{version}", TERMS_VERSION)}
        </p>
        <div className="mt-6">
          <AcceptTermsForm />
        </div>
        <p className="text-muted-foreground mt-6 text-sm">{t.acceptTerms.refuse}</p>
      </div>
      {session.householdId ? (
        <section className="border-border bg-card w-full max-w-sm rounded-lg border p-6">
          <h2 className="font-heading text-lg">{privacyT.exportData.sectionTitle}</h2>
          <div className="mt-3">
            <ExportDataSection limitReached={false} />
          </div>
        </section>
      ) : null}
      <DeleteAccountSection {...deleteAccount} compact />
    </main>
  );
}
