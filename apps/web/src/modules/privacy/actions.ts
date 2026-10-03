"use server";

import { redirect } from "next/navigation";

import { getDb } from "@/platform/db/client";
import type { ActionState } from "@/lib/action-state";
import {
  ACCOUNT_DELETION_PENDING_ROUTE,
  getCurrentSession,
  getEmailSender,
  getPendingAccountDeletion,
  readAuthBaseUrl,
  signOutAction,
} from "@/modules/auth";

import { timeZoneFor } from "./page-props";
import { cancelAccountDeletion, requestAccountDeletion } from "./service";
import { t } from "./strings";

export async function requestAccountDeletionAction(): Promise<ActionState> {
  const session = await getCurrentSession();
  if (!session) {
    return { status: "error", message: t.errors.unauthenticated };
  }
  const outcome = await requestAccountDeletion(session, getDb(), {
    emailSender: getEmailSender(),
    now: new Date(),
    timeZone: await timeZoneFor(session),
    cancelUrl: `${readAuthBaseUrl()}${ACCOUNT_DELETION_PENDING_ROUTE}`,
  });

  switch (outcome.status) {
    case "ok":
    case "already_pending":
      redirect(ACCOUNT_DELETION_PENDING_ROUTE);
    case "failed":
      return { status: "error", message: t.errors.requestFailed };
  }
}

export async function cancelAccountDeletionAction(): Promise<ActionState> {
  const pending = await getPendingAccountDeletion();
  if (!pending) {
    return { status: "error", message: t.errors.notPending };
  }
  const outcome = await cancelAccountDeletion(pending, getDb());

  switch (outcome.status) {
    case "ok":
      redirect("/");
    case "not_pending":
      return { status: "error", message: t.errors.notPending };
    case "failed":
      return { status: "error", message: t.errors.cancelFailed };
  }
}

export async function signOutFromPendingDeletionAction(): Promise<ActionState> {
  return signOutAction();
}
