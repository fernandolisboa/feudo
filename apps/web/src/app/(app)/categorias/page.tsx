import { Suspense } from "react";

import { requireHouseholdSession, type HouseholdSession } from "@/modules/households";
import {
  CategoriesErrorBoundary,
  CategoriesSkeleton,
  CategoriesView,
  getCategoriesPageProps,
} from "@/modules/ledger";

async function CategoriesContent({ session }: { session: HouseholdSession }) {
  const props = await getCategoriesPageProps(session);
  return <CategoriesView {...props} />;
}

export default async function CategoriesPage() {
  const session = await requireHouseholdSession();

  return (
    <CategoriesErrorBoundary>
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesContent session={session} />
      </Suspense>
    </CategoriesErrorBoundary>
  );
}
