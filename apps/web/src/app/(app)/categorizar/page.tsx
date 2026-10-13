import { Suspense } from "react";

import { PageSkeleton } from "@/ui/page-skeleton";
import { requireHouseholdSession, type HouseholdSession } from "@/modules/households";
import {
  getGuidedCategorizationProps,
  GuidedCategorizationErrorBoundary,
  GuidedCategorizationView,
} from "@/modules/ledger";

async function GuidedCategorizationContent({ session }: { session: HouseholdSession }) {
  const props = await getGuidedCategorizationProps(session);
  return <GuidedCategorizationView {...props} />;
}

export default async function GuidedCategorizationPage() {
  const session = await requireHouseholdSession();

  return (
    <GuidedCategorizationErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <GuidedCategorizationContent session={session} />
      </Suspense>
    </GuidedCategorizationErrorBoundary>
  );
}
