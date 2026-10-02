import { Suspense } from "react";

import {
  AnalystReading,
  AnalystReadingErrorBoundary,
  getAnalystReadingProps,
} from "@/modules/analysis";
import { requireHouseholdSession, type HouseholdSession } from "@/modules/households";
import {
  getReservePageProps,
  ReserveErrorBoundary,
  ReserveSkeleton,
  ReserveView,
} from "@/modules/reserve";

// "Gerar nova leitura" runs inside this page's function; analysis'
// ON_DEMAND_BUDGET_MS mirrors it (page.test.ts pins the two together).
export const maxDuration = 60;

async function AnalystReadingContent({ session }: { session: HouseholdSession }) {
  const props = await getAnalystReadingProps(session);
  return props ? <AnalystReading {...props} /> : null;
}

async function ReserveContent({ session }: { session: HouseholdSession }) {
  const props = await getReservePageProps(session);
  return <ReserveView {...props} />;
}

export default async function ReservePage() {
  const session = await requireHouseholdSession();

  return (
    <>
      <ReserveErrorBoundary>
        <Suspense fallback={<ReserveSkeleton />}>
          <ReserveContent session={session} />
        </Suspense>
      </ReserveErrorBoundary>
      <AnalystReadingErrorBoundary>
        <Suspense fallback={null}>
          <AnalystReadingContent session={session} />
        </Suspense>
      </AnalystReadingErrorBoundary>
    </>
  );
}
