import { PageHeader } from "@/components/page-header";
import { getCurrentSession, t } from "@/modules/auth";

export default async function Home() {
  const session = await getCurrentSession();
  const name = session?.name ?? "";

  return (
    <PageHeader overline={t.overview.title} title={t.overview.greeting.replace("{name}", name)} />
  );
}
