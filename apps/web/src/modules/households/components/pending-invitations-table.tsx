"use client";

import { useActionState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { initialActionState } from "@/lib/action-state";

import { cancelInvitationAction } from "../actions";
import type { PendingInvitation } from "../membership";
import { t } from "../strings";

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

function CancelInvitationButton({ invitationId }: { invitationId: string }) {
  const [state, formAction, isPending] = useActionState(cancelInvitationAction, initialActionState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="invitationId" value={invitationId} />
      <Button type="submit" variant="ghost" disabled={isPending}>
        {t.casa.rowActions.cancelInvite}
      </Button>
      {state.status === "error" ? (
        <span className="text-destructive text-xs">{state.message}</span>
      ) : null}
    </form>
  );
}

export function PendingInvitationsTable({ invitations }: { invitations: PendingInvitation[] }) {
  if (invitations.length === 0) {
    return <p className="font-heading text-sm">{t.casa.pendingInvitesEmpty}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
            {t.casa.table.email}
          </TableHead>
          <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
            {t.casa.table.role}
          </TableHead>
          <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
            {t.casa.table.expires}
          </TableHead>
          <TableHead className="text-muted-foreground text-right text-[11px] tracking-wide uppercase">
            {t.casa.table.actions}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => (
          <TableRow key={invitation.id} className="h-[var(--density-row)]">
            <TableCell className="text-muted-foreground">{invitation.email}</TableCell>
            <TableCell>
              <Badge variant="outline">{t.casa.roles[invitation.role]}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground tabular-nums">
              {DATE_FORMATTER.format(invitation.expiresAt)}
            </TableCell>
            <TableCell className="text-right">
              <CancelInvitationButton invitationId={invitation.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
