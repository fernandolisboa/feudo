import { GuideView } from "@/modules/guide";
import { requireHouseholdSession } from "@/modules/households";

export default async function GuidePage() {
  await requireHouseholdSession();

  return <GuideView />;
}
