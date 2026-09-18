import { PageHeader } from "@/ui/page-header";

import { t } from "@/modules/shell";

export default function TransactionsPage() {
  return (
    <>
      <PageHeader
        overline={t.comingSoon.transactions.overline}
        title={t.comingSoon.transactions.title}
      />
      <p className="font-heading text-foreground text-[18px]">{t.comingSoon.transactions.body}</p>
    </>
  );
}
