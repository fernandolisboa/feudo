import { PageHeader } from "@/ui/page-header";

import { t } from "./strings";

export default function TransactionsPage() {
  return (
    <>
      <PageHeader overline={t.overline} title={t.title} />
      <p className="font-heading text-foreground text-[18px]">{t.body}</p>
    </>
  );
}
