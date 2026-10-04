import { MEU_PLUGGY_GUIDE_HREF } from "@/modules/guide";
import { requireHouseholdSession } from "@/modules/households";
import { ConnectBankErrorBoundary, ConnectBankWizard } from "@/modules/sync";

export default async function ConnectBankPage() {
  await requireHouseholdSession();

  return (
    <div className="max-w-2xl">
      <ConnectBankErrorBoundary>
        <ConnectBankWizard guideHref={MEU_PLUGGY_GUIDE_HREF} />
      </ConnectBankErrorBoundary>
    </div>
  );
}
