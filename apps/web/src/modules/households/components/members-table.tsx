import { Badge } from "@/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { formatShortDate } from "@/lib/format-date";

import type { HouseholdMember, HouseholdRole } from "../membership";
import { MemberRowActions } from "./member-row-actions";
import { t } from "../strings";

function roleLabel(role: HouseholdRole): string {
  return t.casa.roles[role];
}

export function MembersTable({
  members,
  currentUserId,
  viewerRole,
  timeZone,
}: {
  members: HouseholdMember[];
  currentUserId: string;
  viewerRole: HouseholdRole;
  timeZone: string;
}) {
  const isLastMember = members.length === 1;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
            {t.casa.table.name}
          </TableHead>
          <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
            {t.casa.table.email}
          </TableHead>
          <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
            {t.casa.table.role}
          </TableHead>
          <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
            {t.casa.table.joined}
          </TableHead>
          <TableHead className="text-muted-foreground text-right text-[11px] tracking-wide uppercase">
            {t.casa.table.actions}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id} className="h-[var(--density-row)]">
            <TableCell className="font-medium">{member.name}</TableCell>
            <TableCell className="text-muted-foreground">{member.email}</TableCell>
            <TableCell>
              <Badge variant={member.role === "owner" ? "default" : "outline"}>
                {roleLabel(member.role)}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground tabular-nums">
              {formatShortDate(member.joinedAt, timeZone)}
            </TableCell>
            <TableCell className="text-right">
              <MemberRowActions
                member={member}
                currentUserId={currentUserId}
                viewerRole={viewerRole}
                isLastMember={isLastMember}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
