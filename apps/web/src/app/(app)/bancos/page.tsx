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

async function BanksContent({ session }: { session: HouseholdSession }) {
  const props = await getBanksPageProps(session);
  return (
    <BanksView
      {...props}
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

export default async function BanksPage() {
  const session = await requireHouseholdSession();

  return (
    <BanksErrorBoundary>
      <Suspense fallback={<BanksSkeleton />}>
        <BanksContent session={session} />
      </Suspense>
    </BanksErrorBoundary>
  );
}
