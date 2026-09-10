import { t } from "../strings";
import { renderEmail, type EmailCopy } from "./render";

export type InvitationEmail = EmailCopy;

// Duplicated from households/strings.ts's role labels, not imported: auth
// must never depend on households (docs/runbooks/auth.md). Only "admin" and
// "member" ever reach this function — options.ts's beforeCreateInvitation
// hook rejects "owner" before an invitation, and therefore this email, can
// ever be built for it.
const ROLE_LABEL_PT_BR: Record<string, string> = {
  admin: "administrador",
  member: "membro",
};

function describeRolePtBR(role: string): string {
  return ROLE_LABEL_PT_BR[role] ?? role;
}

export function buildInvitationEmail(
  url: string,
  householdName: string,
  inviterName: string,
  role: string,
  expiresIn: string,
): InvitationEmail {
  return renderEmail(t.invitationEmail, {
    url,
    householdName,
    inviterName,
    role: describeRolePtBR(role),
    expiresIn,
  });
}
