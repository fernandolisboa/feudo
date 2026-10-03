import { redirect } from "next/navigation";

import { interpolate } from "@/lib/interpolate";
import { AuthShell } from "@/modules/auth";
import { AccountDeletionPending, getAccountDeletionPendingPage, t } from "@/modules/privacy";

export default async function AccountDeletionPendingPage() {
  const page = await getAccountDeletionPendingPage();
  if (page.status === "redirect") {
    redirect(page.to);
  }

  return (
    <AuthShell
      title={t.pending.title}
      subtitle={
        page.status === "pending"
          ? interpolate(t.pending.subtitle, "{date}", page.purgeDate)
          : t.pending.signedOutSubtitle
      }
    >
      <AccountDeletionPending signedIn={page.status === "pending"} />
    </AuthShell>
  );
}
