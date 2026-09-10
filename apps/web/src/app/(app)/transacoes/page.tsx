import { PageHeader } from "@/components/page-header";
import { t } from "@/modules/theme";

export default function TransactionsPage() {
  return (
    <>
      <PageHeader overline={t.placeholder.overline} title={t.nav.transactions} />
      <p className="font-heading text-foreground text-[18px]">{t.placeholder.transactionsBody}</p>
    </>
  );
}
