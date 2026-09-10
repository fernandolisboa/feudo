import { headers } from "next/headers";

import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { InviteMemberDialog } from "@/modules/households/components/invite-member-dialog";
import { MembersTable } from "@/modules/households/components/members-table";
import { PendingInvitationsTable } from "@/modules/households/components/pending-invitations-table";
import { listMembers, listPendingInvitations } from "@/modules/households/membership";
import { requireHouseholdSession } from "@/modules/households/require-household-session";
import { t } from "@/modules/households/strings";

export default async function CasaPage() {
  const session = await requireHouseholdSession();
  const requestHeaders = await headers();

  const members = await listMembers(session, requestHeaders);
  const viewer = members.find((member) => member.userId === session.userId);
  const viewerRole = viewer?.role ?? "member";
  const canManage = viewerRole === "owner" || viewerRole === "admin";

  const invitations = canManage ? await listPendingInvitations(session, requestHeaders) : [];

  return (
    <>
      <PageHeader overline={t.casa.overline} title={t.casa.title} />

      <section>
        <SectionHeader
          title={t.casa.membersSectionTitle}
          actions={canManage ? <InviteMemberDialog /> : undefined}
        />
        <MembersTable members={members} currentUserId={session.userId} viewerRole={viewerRole} />
      </section>

      {canManage ? (
        <section className="mt-8">
          <SectionHeader title={t.casa.pendingInvitesSectionTitle} />
          <PendingInvitationsTable invitations={invitations} />
        </section>
      ) : null}
    </>
  );
}
