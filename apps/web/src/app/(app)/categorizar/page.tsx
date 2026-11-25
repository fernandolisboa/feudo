import { cache, Suspense } from "react";

import { PageSkeleton } from "@/ui/page-skeleton";
import { requireHouseholdSession, type HouseholdSession } from "@/modules/households";
import {
  categorizeTabOf,
  CategorizarTabs,
  getGuidedCategorizationProps,
  getLinkSuggestionsProps,
  GuidedCategorizationErrorBoundary,
  GuidedCategorizationView,
  TransactionLinksView,
  type CategorizeSearchParams,
} from "@/modules/ledger";

// One read for both the tab label's pending count and the Vínculos tab's own
// content, so switching tabs costs no extra round trip and the audit write
// (ADR-0008) happens once per request.
const readLinkSuggestions = cache(getLinkSuggestionsProps);

async function GuidedCategorizationContent({ session }: { session: HouseholdSession }) {
  const props = await getGuidedCategorizationProps(session);
  return <GuidedCategorizationView {...props} />;
}

async function TransactionLinksContent({ session }: { session: HouseholdSession }) {
  const props = await readLinkSuggestions(session);
  return <TransactionLinksView {...props} />;
}

export default async function GuidedCategorizationPage({
  searchParams,
}: {
  searchParams: Promise<CategorizeSearchParams>;
}) {
  const session = await requireHouseholdSession();
  const params = await searchParams;
  const { pendingCount } = await readLinkSuggestions(session);

  return (
    <CategorizarTabs
      initialTab={categorizeTabOf(params)}
      pendingLinksCount={pendingCount}
      categorias={
        <GuidedCategorizationErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <GuidedCategorizationContent session={session} />
          </Suspense>
        </GuidedCategorizationErrorBoundary>
      }
      vinculos={
        <Suspense fallback={<PageSkeleton />}>
          <TransactionLinksContent session={session} />
        </Suspense>
      }
    />
  );
}
