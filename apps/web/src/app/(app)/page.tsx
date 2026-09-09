import { PageHeader } from "@/components/page-header";
import { interpolate } from "@/lib/interpolate";
import { getCurrentSession, t } from "@/modules/auth";

export default async function Home() {
  const session = await getCurrentSession();
  const name = session?.name ?? "";

  return (
    <PageHeader
      overline={t.overview.title}
      title={interpolate(t.overview.greeting, "{name}", name)}
    />
  );
}
