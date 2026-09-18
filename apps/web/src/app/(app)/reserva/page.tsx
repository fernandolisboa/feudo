import { PageHeader } from "@/ui/page-header";

import { t } from "@/modules/shell";

export default function ReservePage() {
  return (
    <>
      <PageHeader overline={t.comingSoon.reserve.overline} title={t.comingSoon.reserve.title} />
      <p className="font-heading text-foreground text-[18px]">{t.comingSoon.reserve.body}</p>
    </>
  );
}
