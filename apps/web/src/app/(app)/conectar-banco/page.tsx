import { requireHouseholdSession } from "@/modules/households";
import { ConnectBankWizard } from "@/modules/sync";

export default async function ConnectBankPage() {
  await requireHouseholdSession();

  return (
    <div className="max-w-2xl">
      <ConnectBankWizard />
    </div>
  );
}
