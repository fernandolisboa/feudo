import { Suspense } from "react";
import { notFound } from "next/navigation";

import {
  BankDetailView,
  BanksErrorBoundary,
  getBankDetailPageProps,
  hasBankProfile,
} from "@/modules/banking-intel";
import { requireHouseholdSession, type HouseholdSession } from "@/modules/households";

import { PageSkeleton } from "@/ui/page-skeleton";

async function BankDetailContent({
  session,
  institutionId,
}: {
  session: HouseholdSession;
  institutionId: string;
}) {
  const props = await getBankDetailPageProps(session, institutionId);
  if (props === null) notFound();
  return <BankDetailView {...props} />;
}

export default async function BankDetailPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;
  if (!hasBankProfile(institutionId)) notFound();
  const session = await requireHouseholdSession();

  return (
    <BanksErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <BankDetailContent session={session} institutionId={institutionId} />
      </Suspense>
    </BanksErrorBoundary>
  );
}
