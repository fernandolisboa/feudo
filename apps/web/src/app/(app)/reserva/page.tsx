import { PageHeader } from "@/components/page-header";
import { t } from "@/modules/theme";

export default function ReservePage() {
  return (
    <>
      <PageHeader overline={t.placeholder.overline} title={t.nav.reserve} />
      <p className="font-heading text-foreground text-[18px]">{t.placeholder.reserveBody}</p>
    </>
  );
}
