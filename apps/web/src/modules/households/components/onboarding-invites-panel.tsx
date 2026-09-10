import { AcceptInvitationButton } from "./accept-invitation-button";
import type { InvitationForUser } from "../membership";
import { t } from "../strings";

function InvitationRow({ invitation }: { invitation: InvitationForUser }) {
  return (
    <div className="border-border flex flex-col gap-2 rounded-lg border p-3">
      <div>
        <p className="font-medium">{invitation.householdName}</p>
        <p className="text-muted-foreground text-sm">
          {t.invitesTab.invitedAs.replace("{role}", t.casa.roles[invitation.role])}
        </p>
      </div>
      <AcceptInvitationButton invitationId={invitation.id} />
    </div>
  );
}

export function OnboardingInvitesPanel({ invitations }: { invitations: InvitationForUser[] }) {
  if (invitations.length === 0) {
    return <p className="font-heading text-sm">{t.invitesTab.empty}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {invitations.map((invitation) => (
        <InvitationRow key={invitation.id} invitation={invitation} />
      ))}
    </div>
  );
}
