import { Suspense } from "react";

import { PageHeader } from "@/ui/page-header";
import { PageTabs, type PageTab } from "@/ui/page-tabs";
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
import {
  LayoutSelectForm,
  PreferencesSectionErrorBoundary,
  resolveShellLayout,
  resolveTheme,
  t,
  ThemeSelectForm,
} from "@/modules/theme";

async function PendingHouseholdDeletionsContent({ session }: { session: HouseholdSession }) {
  const households = await getPendingHouseholdDeletions(session);
  if (households.length === 0) {
    return null;
  }
  return (
    <section className="mb-8">
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
  searchParams: Promise<{ exportacao?: string; aba?: string }>;
}) {
  const session = await requireHouseholdSession();
  const [tourState, { exportacao, aba }] = await Promise.all([getTourState(session), searchParams]);
  const pushNotifications = getPushNotificationsSectionProps(session);
  const exportLimitReached = exportacao === "limite";

  const tabs: PageTab[] = [
    {
      value: "geral",
      label: t.preferences.tabs.general,
      content: (
        <>
          <div className="flex flex-col gap-6 md:flex-row md:flex-wrap md:gap-10">
            <ThemeSelectForm currentTheme={resolveTheme(session.theme)} />
            <LayoutSelectForm currentLayout={resolveShellLayout(session.layout)} />
          </div>
          <TourPreferencesForm autoStart={tourState.autoStart} />
          {pushNotifications ? <PushNotificationsSection {...pushNotifications} /> : null}
        </>
      ),
    },
    {
      value: "dados",
      label: t.preferences.tabs.data,
      content: (
        <>
          <PreferencesSectionErrorBoundary className="mb-8">
            <Suspense fallback={null}>
              <PendingHouseholdDeletionsContent session={session} />
            </Suspense>
          </PreferencesSectionErrorBoundary>

          <section>
            <SectionHeader title={privacyT.exportData.sectionTitle} />
            <ExportDataSection limitReached={exportLimitReached} from="/preferencias" />
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
      ),
    },
  ];

  return (
    <>
      <PageHeader overline={t.preferences.overline} title={t.preferences.title} />
      {/* The export's rate-limit refusal returns here with only ?exportacao=limite;
          open the tab that shows it. */}
      <PageTabs
        label={t.preferences.tabs.label}
        tabs={tabs}
        initialTab={aba ?? (exportLimitReached ? "dados" : undefined)}
      />
    </>
  );
}
