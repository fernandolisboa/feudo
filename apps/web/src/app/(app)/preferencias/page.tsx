import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { getCurrentSession } from "@/modules/auth";
import { t, ThemeSelectForm } from "@/modules/theme";

export default async function PreferencesPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/entrar");
  }

  return (
    <>
      <PageHeader overline={t.preferences.overline} title={t.preferences.title} />
      <ThemeSelectForm currentTheme={session.theme} />
    </>
  );
}
