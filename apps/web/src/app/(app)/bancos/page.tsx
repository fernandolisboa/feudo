import { Suspense } from "react";

import {
  BanksErrorBoundary,
  BanksSkeleton,
  BanksView,
  getBanksPageProps,
} from "@/modules/banking-intel";
import { requireHouseholdSession, type HouseholdSession } from "@/modules/households";

async function BanksContent({ session }: { session: HouseholdSession }) {
  const props = await getBanksPageProps(session);
  return <BanksView {...props} />;
}

export default async function BanksPage() {
  const session = await requireHouseholdSession();

  return (
    <BanksErrorBoundary>
      <Suspense fallback={<BanksSkeleton />}>
        <BanksContent session={session} />
      </Suspense>
    </BanksErrorBoundary>
  );
}
