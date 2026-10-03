import { PageHeader } from "@/ui/page-header";
import { SectionHeader } from "@/ui/section-header";
import { RecentAccessTable, getRecentAccessPageProps, t as auditT } from "@/modules/audit";
import {
  InviteMemberDialog,
  MembersTable,
  PendingInvitationsTable,
  getCasaPageProps,
  requireHouseholdSession,
  t,
} from "@/modules/households";

export default async function CasaPage() {
  const session = await requireHouseholdSession();
  const [{ members, viewerRole, canManage, invitations, timeZone }, recentAccess] =
    await Promise.all([getCasaPageProps(session), getRecentAccessPageProps(session)]);

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
        <RecentAccessTable entries={recentAccess} />
      </section>
    </>
  );
}
