import { PageHeader } from "@/ui/page-header";
import { requireHouseholdSession } from "@/modules/households";
import { getTourState, TourPreferencesForm } from "@/modules/shell";
import { resolveTheme, t, ThemeSelectForm } from "@/modules/theme";

export default async function PreferencesPage() {
  const session = await requireHouseholdSession();
  const tourState = await getTourState(session);

  return (
    <>
      <PageHeader overline={t.preferences.overline} title={t.preferences.title} />
      <ThemeSelectForm currentTheme={resolveTheme(session.theme)} />
      <TourPreferencesForm autoStart={tourState.autoStart} />
    </>
  );
}
