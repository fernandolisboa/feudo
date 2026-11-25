import { Suspense } from "react";

import { PageSkeleton } from "@/ui/page-skeleton";
import {
  getSuggestCategoriesButtonProps,
  readAiCategorySuggestions,
  SuggestCategoriesButton,
} from "@/modules/analysis";
import { requireHouseholdSession, type HouseholdSession } from "@/modules/households";
import {
  categorizeTabOf,
  CategorizarTabs,
  getGuidedCategorizationProps,
  getLinkSuggestionsPendingCount,
  getLinkSuggestionsProps,
  GuidedCategorizationErrorBoundary,
  GuidedCategorizationView,
  TransactionLinksErrorBoundary,
  TransactionLinksView,
  type CategorizeSearchParams,
} from "@/modules/ledger";

// The category-suggestions Server Action's own budget (ADR-0014): kept equal
// to CATEGORY_SUGGESTION_BUDGET_MS so a press always has the full window this
// page promises it (pinned by page-route-config.test.ts).
export const maxDuration = 60;

async function GuidedCategorizationContent({
  session,
  now,
}: {
  session: HouseholdSession;
  now: Date;
}) {
  const aiSuggestions = await readAiCategorySuggestions(session);
  const props = await getGuidedCategorizationProps(session, now, { aiSuggestions });
  const button = await getSuggestCategoriesButtonProps(session, props.aiPendingCount);
  return (
    <GuidedCategorizationView
      {...props}
      suggestSlot={button ? <SuggestCategoriesButton {...button} /> : null}
    />
  );
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
        <TransactionLinksErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <TransactionLinksContent session={session} now={now} />
          </Suspense>
        </TransactionLinksErrorBoundary>
      }
    />
  );
}
