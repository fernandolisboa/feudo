"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initialActionState } from "@/lib/action-state";

import { inviteMemberAction } from "../actions";
import { t } from "../strings";

export function InviteMemberDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(inviteMemberAction, initialActionState);

  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.status === "success") {
      setOpen(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger render={<Button type="button" />}>
        <UserPlus className="size-4" />
        {t.casa.inviteAction}
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t.casa.inviteDialog.title}</DialogTitle>
            <DialogDescription>{t.casa.inviteDialog.description}</DialogDescription>
          </DialogHeader>

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">{t.casa.inviteDialog.emailLabel}</Label>
            <Input id="invite-email" name="email" type="email" autoComplete="off" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-role">{t.casa.inviteDialog.roleLabel}</Label>
            <Select name="role" defaultValue="member">
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t.casa.roles.admin}</SelectItem>
                <SelectItem value="member">{t.casa.roles.member}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              {t.casa.inviteDialog.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t.casa.inviteDialog.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
