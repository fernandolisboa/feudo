"use server";

import { revalidatePath } from "next/cache";

import {
  canManageHouseholdSettings,
  getViewerRole,
  householdScope,
  requireHouseholdSession,
} from "@/modules/households";

import type { ActionState } from "@/lib/action-state";
import { getDb } from "@/platform/db/client";
import { dismissReserveNotice, setHouseholdReserveMultiple, setReserveMark } from "./service";
import { t } from "./strings";
import {
  dismissNoticeFormSchema,
  updateReserveMarkFormSchema,
  updateReserveMultipleFormSchema,
} from "./validation";

export async function updateReserveMultipleAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateReserveMultipleFormSchema.safeParse({
    reserveMultiple: formData.get("reserveMultiple"),
  });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const session = await requireHouseholdSession();
  const db = getDb();
  const viewerRole = await getViewerRole(session, db);
  if (!canManageHouseholdSettings(viewerRole)) {
    return { status: "error", message: t.errors.notAllowed };
  }

  const outcome = await setHouseholdReserveMultiple(
    householdScope(session),
    parsed.data.reserveMultiple,
    db,
  );

  switch (outcome.status) {
    case "ok":
      revalidatePath("/reserva");
      revalidatePath("/");
      return { status: "success", message: t.multipleUpdated };
    case "failed":
      return { status: "error", message: t.errors.failed };
  }
}

export async function dismissReserveNoticeAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = dismissNoticeFormSchema.safeParse({ noticeId: formData.get("noticeId") });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const session = await requireHouseholdSession();
  const outcome = await dismissReserveNotice(
    householdScope(session),
    parsed.data.noticeId,
    getDb(),
  );

  switch (outcome.status) {
    case "ok":
      revalidatePath("/reserva");
      revalidatePath("/");
      return { status: "success", message: t.noticeDismissed };
    case "not_found":
      return { status: "error", message: t.errors.noticeNotFound };
  }
}

export async function updateReserveMarkAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateReserveMarkFormSchema.safeParse({
    accountId: formData.get("accountId"),
    isReserve: formData.get("isReserve"),
    liquidity: formData.get("liquidity"),
    institutionId: formData.get("institutionId"),
  });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const session = await requireHouseholdSession();
  const outcome = await setReserveMark(
    householdScope(session),
    session.userId,
    parsed.data,
    getDb(),
  );

  switch (outcome.status) {
    case "ok":
      revalidatePath("/reserva");
      return { status: "success", message: t.markSaved };
    case "not_found":
      return { status: "error", message: t.errors.accountNotFound };
  }
}
