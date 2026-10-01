"use client";

import { Button } from "@/ui/button";
import { Notice } from "@/ui/notice";
import { initialActionState } from "@/lib/action-state";
import { useActionInTransition } from "@/lib/use-action-in-transition";

import { dismissReserveNoticeAction } from "../actions";
import { t } from "../strings";

export function ReserveNoticePanel({ id, message }: { id: string; message: string }) {
  const { errorMessage, isPending, run } = useActionInTransition(t.errors.failed);

  function handleDismiss() {
    const formData = new FormData();
    formData.set("noticeId", id);
    run(() => dismissReserveNoticeAction(initialActionState, formData));
  }

  return (
    <Notice
      tone={errorMessage ? "danger" : undefined}
      action={
        <Button variant="outline" size="sm" onClick={handleDismiss} disabled={isPending}>
          {errorMessage ? t.error.retry : t.notice.action}
        </Button>
      }
    >
      {errorMessage ?? message}
    </Notice>
  );
}
