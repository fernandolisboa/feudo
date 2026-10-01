import { Suspense } from "react";

import { requireHouseholdSession, type HouseholdSession } from "@/modules/households";
import {
  getReservePageProps,
  ReserveErrorBoundary,
  ReserveSkeleton,
  ReserveView,
} from "@/modules/reserve";

async function ReserveContent({ session }: { session: HouseholdSession }) {
  const props = await getReservePageProps(session);
  return <ReserveView {...props} />;
}

export default async function ReservePage() {
  const session = await requireHouseholdSession();

  return (
    <ReserveErrorBoundary>
      <Suspense fallback={<ReserveSkeleton />}>
        <ReserveContent session={session} />
      </Suspense>
    </ReserveErrorBoundary>
  );
}
