import { Suspense } from "react";

import { PageSkeleton } from "@/ui/page-skeleton";
import { requireHouseholdSession, type HouseholdSession } from "@/modules/households";
import {
  categorizeTabOf,
  CategorizarTabs,
  getGuidedCategorizationProps,
  getLinkSuggestionsPendingCount,
  getLinkSuggestionsProps,
  GuidedCategorizationErrorBoundary,
  GuidedCategorizationView,
  TransactionLinksView,
  type CategorizeSearchParams,
} from "@/modules/ledger";

async function GuidedCategorizationContent({
  session,
  now,
}: {
  session: HouseholdSession;
  now: Date;
}) {
  const props = await getGuidedCategorizationProps(session, now);
  return <GuidedCategorizationView {...props} />;
}

async function TransactionLinksContent({ session, now }: { session: HouseholdSession; now: Date }) {
  const props = await getLinkSuggestionsProps(session, now);
  return <TransactionLinksView {...props} />;
}

export default async function GuidedCategorizationPage({
  searchParams,
}: {
  searchParams: Promise<CategorizeSearchParams>;
}) {
  const session = await requireHouseholdSession();
  const params = await searchParams;
  const now = new Date();
  const pendingCount = await getLinkSuggestionsPendingCount(session, now);

  return (
    <CategorizarTabs
      initialTab={categorizeTabOf(params)}
      pendingLinksCount={pendingCount}
      categorias={
        <GuidedCategorizationErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <GuidedCategorizationContent session={session} now={now} />
          </Suspense>
        </GuidedCategorizationErrorBoundary>
      }
      vinculos={
        <Suspense fallback={<PageSkeleton />}>
          <TransactionLinksContent session={session} now={now} />
        </Suspense>
      }
    />
  );
}
