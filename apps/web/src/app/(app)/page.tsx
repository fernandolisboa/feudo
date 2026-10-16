import { cache, Suspense } from "react";

import {
  AnalystReading,
  AnalystReadingErrorBoundary,
  getAnalystReadingProps,
  isAnalysisEnabled,
} from "@/modules/analysis";
import { requireHouseholdSession, type HouseholdSession } from "@/modules/households";
import {
  getOverviewPageProps,
  OverviewErrorBoundary,
  OverviewHeader,
  OverviewHeaderErrorBoundary,
  OverviewHeaderSkeleton,
  OverviewSkeleton,
  OverviewSummary,
  overviewTabOf,
  OverviewTabs,
  type OverviewSearchParams,
} from "@/modules/ledger";
import {
  getReserveNoticeBannerProps,
  ReserveNoticeBanner,
  ReserveNoticeBannerErrorBoundary,
} from "@/modules/reserve";
import { AccountsSection, getAccountsSectionProps } from "@/modules/sync";

import { getDb } from "@/platform/db/client";

// "Sincronizar agora" and "Gerar nova leitura" run inside this page's
// function; sync's MANUAL_SYNC_BUDGET_MS and analysis' ON_DEMAND_BUDGET_MS
// mirror it (page.test.ts pins them together).
export const maxDuration = 60;

// The header and the summary tab render from the same read; one call per
// request also keeps the access audit to a single row.
const readOverview = cache(getOverviewPageProps);

async function OverviewHeaderContent({
  session,
  searchParams,
}: {
  session: HouseholdSession;
  searchParams: OverviewSearchParams;
}) {
  const props = await readOverview(session, searchParams);
  return <OverviewHeader {...props} />;
}

async function OverviewSummaryContent({
  session,
  searchParams,
}: {
  session: HouseholdSession;
  searchParams: OverviewSearchParams;
}) {
  const props = await readOverview(session, searchParams);
  return <OverviewSummary {...props} />;
}

async function AccountsSectionContent({ session }: { session: HouseholdSession }) {
  const props = await getAccountsSectionProps(session);
  return <AccountsSection {...props} />;
}

async function AnalystReadingContent({ session }: { session: HouseholdSession }) {
  const props = await getAnalystReadingProps(session);
  return props ? <AnalystReading {...props} /> : null;
}

async function ReserveNoticeBannerContent({ session }: { session: HouseholdSession }) {
  const props = await getReserveNoticeBannerProps(session);
  return props ? <ReserveNoticeBanner {...props} /> : null;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<OverviewSearchParams>;
}) {
  const session = await requireHouseholdSession();
  const params = await searchParams;
  const analysisEnabled = await isAnalysisEnabled(session, getDb());

  return (
    <>
      <ReserveNoticeBannerErrorBoundary>
        <Suspense fallback={null}>
          <ReserveNoticeBannerContent session={session} />
        </Suspense>
      </ReserveNoticeBannerErrorBoundary>
      <OverviewHeaderErrorBoundary>
        <Suspense fallback={<OverviewHeaderSkeleton />}>
          <OverviewHeaderContent session={session} searchParams={params} />
        </Suspense>
      </OverviewHeaderErrorBoundary>
      {/* The month switcher's links carry no tab: a new month remounts the
          tabs on the one its address names, so the address and the open tab agree. */}
      <OverviewTabs
        key={params.mes ?? ""}
        initialTab={overviewTabOf(params)}
        summary={
          <OverviewErrorBoundary>
            <Suspense fallback={<OverviewSkeleton />}>
              <OverviewSummaryContent session={session} searchParams={params} />
            </Suspense>
          </OverviewErrorBoundary>
        }
        reading={
          analysisEnabled ? (
            <AnalystReadingErrorBoundary>
              <Suspense fallback={null}>
                <AnalystReadingContent session={session} />
              </Suspense>
            </AnalystReadingErrorBoundary>
          ) : null
        }
        accounts={
          <Suspense fallback={null}>
            <AccountsSectionContent session={session} />
          </Suspense>
        }
      />
    </>
  );
}
