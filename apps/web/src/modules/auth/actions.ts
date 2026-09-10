"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import { t } from "./strings";
import {
  requestMagicLink,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  signIn,
  signOut,
  signUp,
} from "./service";
import {
  magicLinkFormSchema,
  requestPasswordResetFormSchema,
  resendVerificationFormSchema,
  resetPasswordFormSchema,
  signInFormSchema,
  signUpFormSchema,
} from "./validation";

export async function signUpAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const errors = t.errors;

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
    case "rate_limited":
      return { status: "error", message: errors.rateLimited };
    case "sign_up_failed":
      return { status: "error", message: errors.signUpFailed };
  }
}

export async function signInAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const errors = t.errors;

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
    case "rate_limited":
      return { status: "error", message: errors.rateLimited };
    case "failed":
      return { status: "error", message: errors.invalidCredentials };
  }
}

export async function resendVerificationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const errors = t.errors;

  const parsed = resendVerificationFormSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", message: errors.invalidInput };
  }

  const requestHeaders = await headers();
  const outcome = await resendVerification(parsed.data.email, requestHeaders);

  switch (outcome.status) {
    case "ok":
      return { status: "success", message: t.verifyEmail.resent };
    case "rate_limited":
      return { status: "error", message: errors.rateLimited };
    case "failed":
      return { status: "error", message: errors.resendFailed };
  }
}

export async function signOutAction(): Promise<ActionState | undefined> {
  const requestHeaders = await headers();
  const outcome = await signOut(requestHeaders);
  if (outcome.status === "failed") {
    return { status: "error", message: t.errors.signOutFailed };
  }
  redirect("/entrar");
}

export async function requestMagicLinkAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const errors = t.errors;

  const parsed = magicLinkFormSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", message: errors.invalidInput };
  }

  const requestHeaders = await headers();
  const outcome = await requestMagicLink(parsed.data.email, requestHeaders);

  switch (outcome.status) {
    case "ok":
      return { status: "success", message: t.magicLink.sent };
    case "rate_limited":
      return { status: "error", message: errors.rateLimited };
    case "failed":
      return { status: "error", message: errors.magicLinkFailed };
  }
}

export async function requestPasswordResetAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const errors = t.errors;

  const parsed = requestPasswordResetFormSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", message: errors.invalidInput };
  }

  const requestHeaders = await headers();
  const outcome = await requestPasswordReset(parsed.data.email, requestHeaders);

  switch (outcome.status) {
    case "ok":
      return { status: "success", message: t.forgotPassword.sent };
    case "rate_limited":
      return { status: "error", message: errors.rateLimited };
    case "failed":
      return { status: "error", message: errors.resetRequestFailed };
  }
}

export async function resetPasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const errors = t.errors;

  const parsed = resetPasswordFormSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
  });

  if (!parsed.success) {
    return { status: "error", message: errors.invalidInput };
  }

  const requestHeaders = await headers();
  const outcome = await resetPassword(parsed.data, requestHeaders);

  switch (outcome.status) {
    case "ok":
      redirect("/entrar");
    case "invalid_token":
      return { status: "error", message: t.resetPassword.invalidOrExpired };
    case "rate_limited":
      return { status: "error", message: errors.rateLimited };
    case "failed":
      return { status: "error", message: errors.resetFailed };
  }
}
