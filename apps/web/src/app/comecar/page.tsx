import { redirect } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import {
  ClearOfflineCopies,
  getCurrentSession,
  redirectIfAccountDeletionPending,
  redirectIfTermsOutdated,
} from "@/modules/auth";
import {
  OnboardingForm,
  OnboardingInvitesPanel,
  PendingHouseholdDeletions,
  getOnboardingInvites,
  getPendingHouseholdDeletions,
  resolveOnboardingRoute,
  t,
} from "@/modules/households";
import { DeleteAccountSection, getDeleteAccountSectionProps } from "@/modules/privacy";

export default async function OnboardingPage() {
  const session = await getCurrentSession();
  await redirectIfAccountDeletionPending(session);
  const redirectTarget = resolveOnboardingRoute(session);
  if (redirectTarget || !session) {
    redirect(redirectTarget ?? "/entrar");
  }
  redirectIfTermsOutdated(session);

  const [invitations, pendingHouseholds, deleteAccount] = await Promise.all([
    getOnboardingInvites(),
    getPendingHouseholdDeletions(session),
    getDeleteAccountSectionProps(session),
  ]);

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <ClearOfflineCopies />
      <div className="border-border bg-card w-full max-w-sm rounded-lg border p-6">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          {t.onboarding.overline}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{t.onboarding.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.onboarding.subtitle}</p>
        <div className="mt-6">
          <Tabs defaultValue="create">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="create">{t.onboarding.tabCreate}</TabsTrigger>
              <TabsTrigger value="invite">{t.onboarding.tabInvite}</TabsTrigger>
            </TabsList>
            <TabsContent value="create">
              <OnboardingForm />
            </TabsContent>
            <TabsContent value="invite">
              <OnboardingInvitesPanel invitations={invitations} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {pendingHouseholds.length > 0 ? (
        <section className="border-border bg-card w-full max-w-sm rounded-lg border p-6">
          <h2 className="font-heading text-lg">{t.casa.pendingDeletion.title}</h2>
          <div className="mt-3">
            <PendingHouseholdDeletions households={pendingHouseholds} />
          </div>
        </section>
      ) : null}
      <DeleteAccountSection {...deleteAccount} compact />
    </main>
  );
}
