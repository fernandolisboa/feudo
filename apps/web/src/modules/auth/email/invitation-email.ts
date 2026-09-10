import { t } from "../strings";
import { renderEmail, type EmailCopy } from "./render";

export type InvitationEmail = EmailCopy;

function describeRolePtBR(role: string): string {
  if (role === "admin" || role === "member") {
    return t.roleLabels[role];
  }
  return role;
}

export function buildInvitationEmail(params: {
  url: string;
  householdName: string;
  inviterName: string;
  role: string;
  expiresIn: string;
}): InvitationEmail {
  return renderEmail(t.invitationEmail, {
    url: params.url,
    householdName: params.householdName,
    inviterName: params.inviterName,
    role: describeRolePtBR(params.role),
    expiresIn: params.expiresIn,
  });
}
