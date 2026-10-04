import { Suspense } from "react";

import { PageHeader } from "@/ui/page-header";
import { requireHouseholdSession, type HouseholdSession } from "@/modules/households";
import {
  CategoriesErrorBoundary,
  CategoriesSkeleton,
  CategoriesView,
  getCategoriesPageProps,
  t,
} from "@/modules/ledger";

async function CategoriesContent({ session }: { session: HouseholdSession }) {
  const props = await getCategoriesPageProps(session);
  return <CategoriesView {...props} />;
}

export default async function CategoriesPage() {
  const session = await requireHouseholdSession();

  return (
    <>
      <PageHeader overline={t.categoriesPage.overline} title={t.categoriesPage.title} />
      <CategoriesErrorBoundary>
        <Suspense fallback={<CategoriesSkeleton />}>
          <CategoriesContent session={session} />
        </Suspense>
      </CategoriesErrorBoundary>
    </>
  );
}
