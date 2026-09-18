import { PageHeader } from "@/ui/page-header";
import { requireHouseholdSession } from "@/modules/households";
import { resolveTheme, t, ThemeSelectForm } from "@/modules/theme";

export default async function PreferencesPage() {
  const session = await requireHouseholdSession();

  return (
    <>
      <PageHeader overline={t.preferences.overline} title={t.preferences.title} />
      <ThemeSelectForm currentTheme={resolveTheme(session.theme)} />
    </>
  );
}
