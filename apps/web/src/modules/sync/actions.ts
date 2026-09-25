"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getDb } from "@/platform/db/client";
import type { ActionState } from "@/lib/action-state";
import { requireHouseholdSession } from "@/modules/households";

import { InvalidDataProviderError, MissingSecretError } from "./env";
import {
  acceptConsent,
  addConnection,
  connectProvider,
  createSyncDeps,
  deleteConnection,
  moveAccount,
  relabelAccount,
  removeCredentials,
  renameConnection,
  type SyncDeps,
} from "./service";
import { t } from "./strings";
import {
  addConnectionFormSchema,
  connectionIdFormSchema,
  connectProviderFormSchema,
  moveAccountFormSchema,
  relabelAccountFormSchema,
  renameConnectionFormSchema,
} from "./validation";

// formData.get returns null for a field the form never sent; the schema
// itself treats a blank institution name as absent, so null collapses to the
// same empty string rather than needing its own branch.
function institutionNameInput(formData: FormData): string {
  const value = formData.get("institutionName");
  return typeof value === "string" ? value : "";
}

export type AcceptConsentState = ActionState | { status: "accepted"; consentId: string };

export async function acceptConsentAction(
  _prevState: AcceptConsentState,
  formData: FormData,
): Promise<AcceptConsentState> {
  if (formData.get("accepted") !== "on") {
    return { status: "error", message: t.errors.invalidInput };
  }
  const session = await requireHouseholdSession();
  const outcome = await acceptConsent(session, getDb());

  switch (outcome.status) {
    case "ok":
      return { status: "accepted", consentId: outcome.consentId };
    case "failed":
      return { status: "error", message: t.errors.connectFailed };
  }
}

function syncDepsOrMisconfigured(): SyncDeps | ActionState {
  try {
    return createSyncDeps();
  } catch (error) {
    if (error instanceof MissingSecretError || error instanceof InvalidDataProviderError) {
      return { status: "error", message: t.errors.misconfigured };
    }
    throw error;
  }
}

function isActionState(value: SyncDeps | ActionState): value is ActionState {
  return "status" in value;
}

export async function connectProviderAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = connectProviderFormSchema.safeParse({
    consentId: formData.get("consentId"),
    clientId: formData.get("clientId"),
    clientSecret: formData.get("clientSecret"),
    providerItemId: formData.get("providerItemId"),
    institutionName: institutionNameInput(formData),
  });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const deps = syncDepsOrMisconfigured();
  if (isActionState(deps)) {
    return deps;
  }
  const session = await requireHouseholdSession();
  const outcome = await connectProvider(parsed.data, session, getDb(), deps);

  switch (outcome.status) {
    case "ok":
      revalidatePath("/");
      redirect("/");
    case "consent_required":
      return { status: "error", message: t.errors.consentRequired };
    case "rate_limited":
      return { status: "error", message: t.errors.rateLimited };
    case "invalid_credentials":
      return { status: "error", message: t.errors.invalidCredentials };
    case "item_not_found":
      return { status: "error", message: t.errors.itemNotFound };
    case "already_connected":
      return { status: "error", message: t.errors.alreadyConnected };
    case "provider_unavailable":
      return { status: "error", message: t.errors.providerUnavailable };
    case "failed":
      return { status: "error", message: t.errors.connectFailed };
  }
}

export async function addConnectionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = addConnectionFormSchema.safeParse({
    providerItemId: formData.get("providerItemId"),
    institutionName: institutionNameInput(formData),
  });
  if (!parsed.success || formData.get("accepted") !== "on") {
    return { status: "error", message: t.errors.invalidInput };
  }

  const deps = syncDepsOrMisconfigured();
  if (isActionState(deps)) {
    return deps;
  }
  const session = await requireHouseholdSession();
  const outcome = await addConnection(parsed.data, session, getDb(), deps);

  switch (outcome.status) {
    case "ok":
      revalidatePath("/");
      return { status: "success", message: t.connections.addDialog.added };
    case "no_credentials":
      return { status: "error", message: t.errors.noCredentials };
    case "credentials_unreadable":
      return { status: "error", message: t.errors.credentialsUnreadable };
    case "rate_limited":
      return { status: "error", message: t.errors.rateLimited };
    case "invalid_credentials":
      return { status: "error", message: t.errors.invalidCredentials };
    case "item_not_found":
      return { status: "error", message: t.errors.itemNotFound };
    case "already_connected":
      return { status: "error", message: t.errors.alreadyConnected };
    case "provider_unavailable":
      return { status: "error", message: t.errors.providerUnavailable };
    case "failed":
      return { status: "error", message: t.errors.connectFailed };
  }
}

export async function removeCredentialsAction(): Promise<ActionState> {
  const session = await requireHouseholdSession();
  const outcome = await removeCredentials(session, getDb());

  switch (outcome.status) {
    case "ok":
      revalidatePath("/");
      return { status: "success", message: t.connections.removeCredentialsDialog.removed };
    case "not_found":
      return { status: "error", message: t.errors.noCredentials };
    case "failed":
      return { status: "error", message: t.errors.connectFailed };
  }
}

export async function deleteConnectionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = connectionIdFormSchema.safeParse({ connectionId: formData.get("connectionId") });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const session = await requireHouseholdSession();
  const outcome = await deleteConnection(parsed.data.connectionId, session, getDb());

  switch (outcome.status) {
    case "ok":
      revalidatePath("/");
      return { status: "success", message: t.connections.deleteDialog.deleted };
    case "not_found":
      return { status: "error", message: t.errors.connectionNotFound };
    case "failed":
      return { status: "error", message: t.errors.connectFailed };
  }
}

export async function renameConnectionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = renameConnectionFormSchema.safeParse({
    connectionId: formData.get("connectionId"),
    institutionName: formData.get("institutionName"),
  });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const session = await requireHouseholdSession();
  const outcome = await renameConnection(parsed.data, session, getDb());

  switch (outcome.status) {
    case "ok":
      revalidatePath("/");
      return { status: "success", message: t.connections.renameDialog.renamed };
    case "not_found":
      return { status: "error", message: t.errors.connectionNotFound };
    case "failed":
      return { status: "error", message: t.errors.connectFailed };
  }
}

export async function relabelAccountAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = relabelAccountFormSchema.safeParse({
    accountId: formData.get("accountId"),
    label: formData.get("label"),
  });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const session = await requireHouseholdSession();
  const outcome = await relabelAccount(parsed.data, session, getDb());

  switch (outcome.status) {
    case "ok":
      revalidatePath("/");
      return { status: "success", message: t.accounts.relabelled };
    case "not_found":
      return { status: "error", message: t.errors.accountNotFound };
    case "failed":
      return { status: "error", message: t.errors.connectFailed };
  }
}

export async function moveAccountAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = moveAccountFormSchema.safeParse({
    accountId: formData.get("accountId"),
    householdId: formData.get("householdId"),
  });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const session = await requireHouseholdSession();
  const outcome = await moveAccount(parsed.data, session, getDb());

  switch (outcome.status) {
    case "ok":
      revalidatePath("/", "layout");
      return { status: "success", message: t.connections.moveDialog.moved };
    case "not_found":
      return { status: "error", message: t.errors.accountNotMovable };
    case "not_member":
      return { status: "error", message: t.errors.notAMember };
    case "failed":
      return { status: "error", message: t.errors.connectFailed };
  }
}
