import { Suspense } from "react";

import { PageHeader } from "@/ui/page-header";
import { SectionHeader } from "@/ui/section-header";
import { Skeleton } from "@/ui/skeleton";
import {
  getPendingHouseholdDeletions,
  PendingHouseholdDeletions,
  requireHouseholdSession,
  t as householdsT,
  type HouseholdSession,
} from "@/modules/households";
import {
  DeleteAccountSection,
  ExportDataSection,
  getDeleteAccountSectionProps,
  t as privacyT,
} from "@/modules/privacy";
import {
  getPushNotificationsSectionProps,
  PushNotificationsSection,
} from "@/modules/notifications";
import { getTourState, TourPreferencesForm } from "@/modules/shell";
import { PreferencesSectionErrorBoundary, resolveTheme, t, ThemeSelectForm } from "@/modules/theme";

async function PendingHouseholdDeletionsContent({ session }: { session: HouseholdSession }) {
  const households = await getPendingHouseholdDeletions(session);
  if (households.length === 0) {
    return null;
  }
  return (
    <section className="mt-8">
      <SectionHeader title={householdsT.casa.pendingDeletion.title} />
      <PendingHouseholdDeletions households={households} />
    </section>
  );
}

async function DeleteAccountContent({ session }: { session: HouseholdSession }) {
  const props = await getDeleteAccountSectionProps(session);
  return <DeleteAccountSection {...props} />;
}

export default async function PreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ exportacao?: string }>;
}) {
  const session = await requireHouseholdSession();
  const [tourState, { exportacao }] = await Promise.all([getTourState(session), searchParams]);
  const pushNotifications = getPushNotificationsSectionProps(session);

  return (
    <>
      <PageHeader overline={t.preferences.overline} title={t.preferences.title} />
      <ThemeSelectForm currentTheme={resolveTheme(session.theme)} />
      <TourPreferencesForm autoStart={tourState.autoStart} />
      {pushNotifications ? <PushNotificationsSection {...pushNotifications} /> : null}

      <PreferencesSectionErrorBoundary className="mt-8">
        <Suspense fallback={null}>
          <PendingHouseholdDeletionsContent session={session} />
        </Suspense>
      </PreferencesSectionErrorBoundary>

      <section className="mt-8">
        <SectionHeader title={privacyT.exportData.sectionTitle} />
        <ExportDataSection limitReached={exportacao === "limite"} from="/preferencias" />
      </section>

      <section className="mt-8">
        <SectionHeader title={privacyT.deleteAccount.sectionTitle} />
        <PreferencesSectionErrorBoundary>
          <Suspense fallback={<Skeleton className="h-24 w-full max-w-prose" />}>
            <DeleteAccountContent session={session} />
          </Suspense>
        </PreferencesSectionErrorBoundary>
      </section>
    </>
  );
}
