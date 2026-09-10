"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db/client";
import type { ActionState } from "@/lib/action-state";
import { getCurrentSession } from "@/modules/auth";

import {
  acceptInvitation,
  cancelInvitation,
  inviteMember,
  leaveHousehold,
  removeMember,
  transferOwnership,
  updateMemberRole,
} from "./membership";
import { requireHouseholdSession } from "./require-household-session";
import { createHousehold, switchHousehold } from "./service";
import { t } from "./strings";
import {
  createHouseholdFormSchema,
  inviteMemberFormSchema,
  invitationIdFormSchema,
  memberIdFormSchema,
  switchHouseholdFormSchema,
  updateMemberRoleFormSchema,
} from "./validation";

export async function createHouseholdAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createHouseholdFormSchema.safeParse({
    name: formData.get("name"),
    timeZone: formData.get("timeZone") || undefined,
    reserveMultiple: formData.get("reserveMultiple") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const requestHeaders = await headers();
  const session = await getCurrentSession();
  const outcome = await createHousehold(parsed.data, session, getDb(), requestHeaders);

  switch (outcome.status) {
    case "ok":
      redirect("/");
    case "unauthenticated":
      return { status: "error", message: t.errors.unauthenticated };
    case "already_has_household":
      return { status: "error", message: t.errors.alreadyHasHousehold };
    case "failed":
      return { status: "error", message: t.errors.createFailed };
  }
}

export async function switchHouseholdAction(householdId: string): Promise<ActionState> {
  const parsed = switchHouseholdFormSchema.safeParse({ householdId });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const requestHeaders = await headers();
  const outcome = await switchHousehold(parsed.data.householdId, requestHeaders);

  switch (outcome.status) {
    case "ok":
      redirect("/");
    case "not_a_member":
      return { status: "error", message: t.errors.notAMember };
    case "failed":
      return { status: "error", message: t.errors.switchFailed };
  }
}

export async function inviteMemberAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = inviteMemberFormSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const requestHeaders = await headers();
  const session = await requireHouseholdSession();
  const outcome = await inviteMember(parsed.data, session, getDb(), requestHeaders);

  switch (outcome.status) {
    case "ok":
      revalidatePath("/casa");
      return { status: "success", message: t.casa.inviteSent };
    case "unauthenticated":
      return { status: "error", message: t.errors.unauthenticated };
    case "not_allowed":
      return { status: "error", message: t.errors.notAllowed };
    case "already_a_member":
      return { status: "error", message: t.errors.alreadyAMember };
    case "already_invited":
      return { status: "error", message: t.errors.alreadyInvited };
    case "rate_limited":
      return { status: "error", message: t.errors.inviteRateLimited };
    case "failed":
      return { status: "error", message: t.errors.inviteFailed };
  }
}

export async function cancelInvitationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = invitationIdFormSchema.safeParse({
    invitationId: formData.get("invitationId"),
  });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const requestHeaders = await headers();
  const session = await requireHouseholdSession();
  const outcome = await cancelInvitation(parsed.data.invitationId, session, requestHeaders);

  switch (outcome.status) {
    case "ok":
      revalidatePath("/casa");
      return { status: "success", message: t.casa.invitationCancelled };
    case "unauthenticated":
      return { status: "error", message: t.errors.unauthenticated };
    case "not_allowed":
      return { status: "error", message: t.errors.notAllowed };
    case "not_found":
      return { status: "error", message: t.errors.invitationNotFound };
    case "failed":
      return { status: "error", message: t.errors.cancelInvitationFailed };
  }
}

export async function acceptInvitationAction(invitationId: string): Promise<ActionState> {
  const parsed = invitationIdFormSchema.safeParse({ invitationId });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const requestHeaders = await headers();
  const session = await getCurrentSession();
  const outcome = await acceptInvitation(parsed.data.invitationId, session, requestHeaders);

  switch (outcome.status) {
    case "ok":
      redirect("/");
    case "unauthenticated":
      return { status: "error", message: t.errors.unauthenticated };
    case "not_found":
      return { status: "error", message: t.errors.invitationNotFound };
    case "wrong_email":
      return { status: "error", message: t.errors.invitationWrongEmail };
    case "email_not_verified":
      return { status: "error", message: t.errors.emailNotVerified };
    case "failed":
      return { status: "error", message: t.errors.acceptInvitationFailed };
  }
}

export async function removeMemberAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = memberIdFormSchema.safeParse({ memberId: formData.get("memberId") });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const requestHeaders = await headers();
  const session = await requireHouseholdSession();
  const outcome = await removeMember(parsed.data.memberId, session, requestHeaders);

  switch (outcome.status) {
    case "ok":
      revalidatePath("/casa");
      return { status: "success", message: t.casa.memberRemoved };
    case "unauthenticated":
      return { status: "error", message: t.errors.unauthenticated };
    case "cannot_remove_owner":
      return { status: "error", message: t.errors.cannotRemoveOwner };
    case "not_allowed":
      return { status: "error", message: t.errors.notAllowed };
    case "not_found":
      return { status: "error", message: t.errors.memberNotFound };
    case "failed":
      return { status: "error", message: t.errors.removeMemberFailed };
  }
}

export async function updateMemberRoleAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateMemberRoleFormSchema.safeParse({
    memberId: formData.get("memberId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const requestHeaders = await headers();
  const session = await requireHouseholdSession();
  const outcome = await updateMemberRole(parsed.data, session, requestHeaders);

  switch (outcome.status) {
    case "ok":
      revalidatePath("/casa");
      return { status: "success", message: t.casa.roleUpdated };
    case "unauthenticated":
      return { status: "error", message: t.errors.unauthenticated };
    case "not_allowed":
      return { status: "error", message: t.errors.notAllowed };
    case "not_found":
      return { status: "error", message: t.errors.memberNotFound };
    case "failed":
      return { status: "error", message: t.errors.updateRoleFailed };
  }
}

export async function leaveHouseholdAction(): Promise<ActionState> {
  const requestHeaders = await headers();
  const session = await requireHouseholdSession();
  const outcome = await leaveHousehold(session, getDb(), requestHeaders);

  switch (outcome.status) {
    case "ok":
      redirect("/");
    case "unauthenticated":
      return { status: "error", message: t.errors.unauthenticated };
    case "owner_must_transfer_first":
      return { status: "error", message: t.errors.ownerMustTransferFirst };
    case "failed":
      return { status: "error", message: t.errors.leaveFailed };
  }
}

export async function transferOwnershipAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = memberIdFormSchema.safeParse({ memberId: formData.get("memberId") });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const session = await requireHouseholdSession();
  const outcome = await transferOwnership(parsed.data.memberId, session, getDb());

  switch (outcome.status) {
    case "ok":
      revalidatePath("/casa");
      return { status: "success", message: t.casa.ownershipTransferred };
    case "unauthenticated":
      return { status: "error", message: t.errors.unauthenticated };
    case "not_allowed":
      return { status: "error", message: t.errors.notAllowed };
    case "member_not_found":
      return { status: "error", message: t.errors.memberNotFound };
    case "already_owner":
      return { status: "error", message: t.errors.alreadyOwner };
    case "failed":
      return { status: "error", message: t.errors.transferOwnershipFailed };
  }
}
