import { PageHeader } from "@/ui/page-header";
import { interpolate } from "@/lib/interpolate";
import { t } from "@/modules/auth";
import { requireHouseholdSession } from "@/modules/households";
import { AccountsSection, getAccountsSectionProps } from "@/modules/sync";

export default async function Home() {
  const session = await requireHouseholdSession();
  const accountsSection = await getAccountsSectionProps(session);

  return (
    <>
      <PageHeader
        overline={t.overview.title}
        title={interpolate(t.overview.greeting, "{name}", session.name)}
      />
      <AccountsSection {...accountsSection} />
    </>
  );
}
