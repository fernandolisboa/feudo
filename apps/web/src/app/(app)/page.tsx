import { Suspense } from "react";

import {
  AnalystReading,
  AnalystReadingErrorBoundary,
  getAnalystReadingProps,
} from "@/modules/analysis";
import { requireHouseholdSession, type HouseholdSession } from "@/modules/households";
import {
  getOverviewPageProps,
  OverviewErrorBoundary,
  OverviewSkeleton,
  OverviewView,
  type OverviewSearchParams,
} from "@/modules/ledger";
import {
  getReserveNoticeBannerProps,
  ReserveNoticeBanner,
  ReserveNoticeBannerErrorBoundary,
} from "@/modules/reserve";
import { AccountsSection, getAccountsSectionProps } from "@/modules/sync";

// "Sincronizar agora" and "Gerar nova leitura" run inside this page's
// function; sync's MANUAL_SYNC_BUDGET_MS and analysis' ON_DEMAND_BUDGET_MS
// mirror it (page.test.ts pins them together).
export const maxDuration = 60;

async function OverviewContent({
  session,
  searchParams,
}: {
  session: HouseholdSession;
  searchParams: OverviewSearchParams;
}) {
  const props = await getOverviewPageProps(session, searchParams);
  return <OverviewView {...props} />;
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

  return (
    <>
      <ReserveNoticeBannerErrorBoundary>
        <Suspense fallback={null}>
          <ReserveNoticeBannerContent session={session} />
        </Suspense>
      </ReserveNoticeBannerErrorBoundary>
      <OverviewErrorBoundary>
        <Suspense fallback={<OverviewSkeleton />}>
          <OverviewContent session={session} searchParams={params} />
        </Suspense>
      </OverviewErrorBoundary>
      <AnalystReadingErrorBoundary>
        <Suspense fallback={null}>
          <AnalystReadingContent session={session} />
        </Suspense>
      </AnalystReadingErrorBoundary>
      <div className="mt-10" data-tour="overview.accounts">
        <Suspense fallback={null}>
          <AccountsSectionContent session={session} />
        </Suspense>
      </div>
    </>
  );
}
