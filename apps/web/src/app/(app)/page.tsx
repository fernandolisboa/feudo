import { Suspense } from "react";

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

// "Sincronizar agora" runs inside this page's function; sync's
// MANUAL_SYNC_BUDGET_MS mirrors it (page.test.ts pins the two together).
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
      <div className="mt-10">
        <Suspense fallback={null}>
          <AccountsSectionContent session={session} />
        </Suspense>
      </div>
    </>
  );
}
