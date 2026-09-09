"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { ActionState } from "./action-state";
import { authStrings } from "./strings";
import { resendVerification, signIn, signOut, signUp } from "./service";
import { resendVerificationFormSchema, signInFormSchema, signUpFormSchema } from "./validation";

export async function signUpAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const errors = authStrings.ptBR.errors;

  const parsed = signUpFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    termsAccepted: formData.get("termsAccepted") !== null,
  });

  if (!parsed.success) {
    return { status: "error", message: errors.invalidInput };
  }

  const requestHeaders = await headers();
  const outcome = await signUp(parsed.data, requestHeaders);

  switch (outcome.status) {
    case "ok":
      redirect(`/verificar-email?email=${encodeURIComponent(parsed.data.email)}`);
    case "terms_not_accepted":
      return { status: "error", message: errors.termsRequired };
    case "registration_closed":
      return { status: "error", message: errors.registrationClosed };
    case "invite_required":
      return { status: "error", message: errors.inviteRequired };
    case "sign_up_failed":
      return { status: "error", message: errors.signUpFailed };
  }
}

export async function signInAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const errors = authStrings.ptBR.errors;

  const parsed = signInFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: errors.invalidInput };
  }

  const requestHeaders = await headers();
  const outcome = await signIn(parsed.data, requestHeaders);

  switch (outcome.status) {
    case "ok":
      redirect("/");
    case "invalid_credentials":
      return { status: "error", message: errors.invalidCredentials };
    case "email_not_verified":
      return { status: "error", message: errors.emailNotVerified };
  }
}

export async function resendVerificationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const errors = authStrings.ptBR.errors;

  const parsed = resendVerificationFormSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", message: errors.invalidInput };
  }

  const outcome = await resendVerification(parsed.data.email);

  if (outcome.status === "failed") {
    return { status: "error", message: errors.resendFailed };
  }

  return { status: "success", message: authStrings.ptBR.verifyEmail.resent };
}

export async function signOutAction(): Promise<void> {
  const requestHeaders = await headers();
  await signOut(requestHeaders);
  redirect("/entrar");
}
