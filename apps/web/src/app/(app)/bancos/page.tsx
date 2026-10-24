import { Suspense } from "react";

import {
  AnalystBanksNote,
  AnalystReadingErrorBoundary,
  getAnalystBanksNoteProps,
} from "@/modules/analysis";
import {
  BanksErrorBoundary,
  BanksSkeleton,
  BanksView,
  getBanksPageProps,
} from "@/modules/banking-intel";
import { requireHouseholdSession, type HouseholdSession } from "@/modules/households";

async function AnalystBanksNoteContent({ session }: { session: HouseholdSession }) {
  const props = await getAnalystBanksNoteProps(session);
  return props ? <AnalystBanksNote {...props} /> : null;
}

async function BanksContent({
  session,
  initialTab,
}: {
  session: HouseholdSession;
  initialTab: string | undefined;
}) {
  const props = await getBanksPageProps(session);
  return (
    <BanksView
      {...props}
      initialTab={initialTab}
      analystNote={
        <AnalystReadingErrorBoundary>
          <Suspense fallback={null}>
            <AnalystBanksNoteContent session={session} />
          </Suspense>
        </AnalystReadingErrorBoundary>
      }
    />
  );
}

export default async function BanksPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const session = await requireHouseholdSession();
  const { aba } = await searchParams;

  return (
    <BanksErrorBoundary>
      <Suspense fallback={<BanksSkeleton />}>
        <BanksContent session={session} initialTab={aba} />
      </Suspense>
    </BanksErrorBoundary>
  );
}
