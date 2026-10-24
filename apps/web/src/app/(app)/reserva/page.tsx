import { Suspense } from "react";

import {
  AnalystReading,
  AnalystReadingErrorBoundary,
  getAnalystReadingProps,
  isAnalysisEnabled,
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

async function ReserveContent({
  session,
  initialTab,
  analysisEnabled,
}: {
  session: HouseholdSession;
  initialTab: string | undefined;
  analysisEnabled: boolean;
}) {
  const props = await getReservePageProps(session);
  return (
    <ReserveView
      {...props}
      initialTab={initialTab}
      analystReading={
        analysisEnabled ? (
          <AnalystReadingErrorBoundary>
            <Suspense fallback={null}>
              <AnalystReadingContent session={session} />
            </Suspense>
          </AnalystReadingErrorBoundary>
        ) : undefined
      }
    />
  );
}

export default async function ReservePage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const session = await requireHouseholdSession();
  const [{ aba }, analysisEnabled] = await Promise.all([searchParams, isAnalysisEnabled(session)]);

  return (
    <ReserveErrorBoundary>
      <Suspense fallback={<ReserveSkeleton />}>
        <ReserveContent session={session} initialTab={aba} analysisEnabled={analysisEnabled} />
      </Suspense>
    </ReserveErrorBoundary>
  );
}
