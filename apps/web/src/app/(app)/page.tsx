import { PageHeader } from "@/components/page-header";
import { interpolate } from "@/lib/interpolate";
import { t } from "@/modules/auth";
import { requireHouseholdSession } from "@/modules/households";

export default async function Home() {
  const session = await requireHouseholdSession();

  return (
    <PageHeader
      overline={t.overview.title}
      title={interpolate(t.overview.greeting, "{name}", session.name)}
    />
  );
}
