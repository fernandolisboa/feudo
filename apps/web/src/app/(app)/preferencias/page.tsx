import { PageHeader } from "@/ui/page-header";
import { SectionHeader } from "@/ui/section-header";
import {
  getPendingHouseholdDeletions,
  PendingHouseholdDeletions,
  requireHouseholdSession,
  t as householdsT,
} from "@/modules/households";
import {
  DeleteAccountSection,
  ExportDataSection,
  getDeleteAccountSectionProps,
  t as privacyT,
} from "@/modules/privacy";
import { getTourState, TourPreferencesForm } from "@/modules/shell";
import { resolveTheme, t, ThemeSelectForm } from "@/modules/theme";

export default async function PreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ exportacao?: string }>;
}) {
  const session = await requireHouseholdSession();
  const [tourState, pendingHouseholds, deleteAccount, { exportacao }] = await Promise.all([
    getTourState(session),
    getPendingHouseholdDeletions(session),
    getDeleteAccountSectionProps(session),
    searchParams,
  ]);

  return (
    <>
      <PageHeader overline={t.preferences.overline} title={t.preferences.title} />
      <ThemeSelectForm currentTheme={resolveTheme(session.theme)} />
      <TourPreferencesForm autoStart={tourState.autoStart} />

      {pendingHouseholds.length > 0 ? (
        <section className="mt-8">
          <SectionHeader title={householdsT.casa.pendingDeletion.title} />
          <PendingHouseholdDeletions households={pendingHouseholds} />
        </section>
      ) : null}

      <section className="mt-8">
        <SectionHeader title={privacyT.exportData.sectionTitle} />
        <ExportDataSection limitReached={exportacao === "limite"} from="/preferencias" />
      </section>

      <section className="mt-8">
        <SectionHeader title={privacyT.deleteAccount.sectionTitle} />
        <DeleteAccountSection {...deleteAccount} />
      </section>
    </>
  );
}
