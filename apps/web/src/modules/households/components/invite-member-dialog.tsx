"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";

import { Alert, AlertDescription } from "@/ui/alert";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { initialActionState } from "@/lib/action-state";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";

import { inviteMemberAction } from "../actions";
import { t } from "../strings";

const ROLE_ITEMS = [
  { value: "admin", label: t.casa.roles.admin },
  { value: "member", label: t.casa.roles.member },
];

export function InviteMemberDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(inviteMemberAction, initialActionState);

  useCloseOnSuccess(state, setOpen);

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
            <Select name="role" items={ROLE_ITEMS} defaultValue="member">
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
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
