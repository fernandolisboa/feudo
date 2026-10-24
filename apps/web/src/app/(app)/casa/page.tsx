import { Suspense } from "react";

import { PageHeader } from "@/ui/page-header";
import { PageTabs, type PageTab } from "@/ui/page-tabs";
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

export default async function CasaPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const session = await requireHouseholdSession();
  const [{ members, viewerRole, canManage, invitations, timeZone, deletion }, { aba }] =
    await Promise.all([getCasaPageProps(session), searchParams]);

  const tabs: PageTab[] = [
    {
      value: "pessoas",
      label: t.casa.tabs.people,
      content: (
        <>
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
        </>
      ),
    },
    {
      value: "analista",
      label: t.casa.tabs.analyst,
      content: (
        <section>
          <SectionHeader title={analysisT.aiSettings.sectionTitle} />
          <AiSettingsErrorBoundary>
            <Suspense fallback={null}>
              <AiSettingsContent session={session} />
            </Suspense>
          </AiSettingsErrorBoundary>
        </section>
      ),
    },
    {
      value: "acessos",
      label: t.casa.tabs.access,
      content: (
        <section>
          <SectionHeader title={auditT.recentAccess.sectionTitle} />
          <RecentAccessErrorBoundary>
            <Suspense fallback={null}>
              <RecentAccessContent session={session} />
            </Suspense>
          </RecentAccessErrorBoundary>
        </section>
      ),
    },
    ...(deletion
      ? [
          {
            value: "excluir",
            label: t.casa.tabs.delete,
            content: (
              <section>
                <SectionHeader title={t.casa.deleteHousehold.sectionTitle} />
                <DeleteHouseholdSection {...deletion} />
              </section>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader overline={t.casa.overline} title={t.casa.title} />
      <PageTabs label={t.casa.tabs.label} tabs={tabs} initialTab={aba} />
    </>
  );
}
