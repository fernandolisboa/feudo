import { Suspense } from "react";

import { requireHouseholdSession, type HouseholdSession } from "@/modules/households";
import {
  getTransactionsPageProps,
  TransactionsErrorBoundary,
  TransactionsSkeleton,
  TransactionsView,
  type TransactionsSearchParams,
} from "@/modules/ledger";

async function TransactionsContent({
  session,
  searchParams,
}: {
  session: HouseholdSession;
  searchParams: TransactionsSearchParams;
}) {
  const props = await getTransactionsPageProps(session, searchParams);
  return <TransactionsView {...props} />;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<TransactionsSearchParams>;
}) {
  const session = await requireHouseholdSession();
  const params = await searchParams;

  return (
    <TransactionsErrorBoundary>
      <Suspense fallback={<TransactionsSkeleton />}>
        <TransactionsContent session={session} searchParams={params} />
      </Suspense>
    </TransactionsErrorBoundary>
  );
}
