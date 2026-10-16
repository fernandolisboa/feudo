import { Suspense } from "react";

import { PageHeader } from "@/ui/page-header";
import { SectionHeader } from "@/ui/section-header";
import {
  AiSettingsErrorBoundary,
  AiSettingsSection,
  getAiSettingsSectionProps,
  t as analysisT,
} from "@/modules/analysis";
import {
  RecentAccessErrorBoundary,
  RecentAccessTable,
  getRecentAccessPageProps,
  t as auditT,
} from "@/modules/audit";
import {
  DeleteHouseholdSection,
  InviteMemberDialog,
  MembersTable,
  PendingInvitationsTable,
  getCasaPageProps,
  requireHouseholdSession,
  type HouseholdSession,
  t,
} from "@/modules/households";

async function RecentAccessContent({ session }: { session: HouseholdSession }) {
  const recentAccess = await getRecentAccessPageProps(session);
  return <RecentAccessTable entries={recentAccess} />;
}

async function AiSettingsContent({ session }: { session: HouseholdSession }) {
  const aiSettings = await getAiSettingsSectionProps(session);
  return <AiSettingsSection {...aiSettings} />;
}

export default async function CasaPage() {
  const session = await requireHouseholdSession();
  const { members, viewerRole, canManage, invitations, timeZone, deletion } =
    await getCasaPageProps(session);

  return (
    <>
      <PageHeader overline={t.casa.overline} title={t.casa.title} />

      <section>
        <SectionHeader
          title={t.casa.membersSectionTitle}
          actions={canManage ? <InviteMemberDialog /> : undefined}
        />
        <MembersTable
          members={members}
          currentUserId={session.userId}
          viewerRole={viewerRole}
          timeZone={timeZone}
        />
      </section>

      {canManage ? (
        <section className="mt-8">
          <SectionHeader title={t.casa.pendingInvitesSectionTitle} />
          <PendingInvitationsTable invitations={invitations} timeZone={timeZone} />
        </section>
      ) : null}

      <section className="mt-8">
        <SectionHeader title={auditT.recentAccess.sectionTitle} />
        <RecentAccessErrorBoundary>
          <Suspense fallback={null}>
            <RecentAccessContent session={session} />
          </Suspense>
        </RecentAccessErrorBoundary>
      </section>

      <section className="mt-8">
        <SectionHeader title={analysisT.aiSettings.sectionTitle} />
        <AiSettingsErrorBoundary>
          <Suspense fallback={null}>
            <AiSettingsContent session={session} />
          </Suspense>
        </AiSettingsErrorBoundary>
      </section>
      {deletion ? (
        <section className="mt-8">
          <SectionHeader title={t.casa.deleteHousehold.sectionTitle} />
          <DeleteHouseholdSection {...deletion} />
        </section>
      ) : null}
    </>
  );
}
