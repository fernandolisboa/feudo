import { Suspense } from "react";

import {
  AnalysesErrorBoundary,
  AnalysesOff,
  AnalysesView,
  getAnalysesPageProps,
  READING_PARAM,
} from "@/modules/analysis";
import { requireHouseholdSession, type HouseholdSession } from "@/modules/households";
import { PageSkeleton } from "@/ui/page-skeleton";

// "Gerar nova leitura" runs inside this page's function; analysis'
// ON_DEMAND_BUDGET_MS mirrors it (page.test.ts pins the two together).
export const maxDuration = 60;

type AnalysesSearchParams = Record<string, string | string[] | undefined>;

async function AnalysesContent({
  session,
  readingId,
}: {
  session: HouseholdSession;
  readingId: string | string[] | undefined;
}) {
  const props = await getAnalysesPageProps(session, readingId);
  return props ? <AnalysesView {...props} /> : <AnalysesOff />;
}

export default async function AnalysesPage({
  searchParams,
}: {
  searchParams: Promise<AnalysesSearchParams>;
}) {
  const session = await requireHouseholdSession();
  const params = await searchParams;

  return (
    <AnalysesErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <AnalysesContent session={session} readingId={params[READING_PARAM]} />
      </Suspense>
    </AnalysesErrorBoundary>
  );
}
