import { APIError } from "better-auth/api";
import { evaluateRegistrationMode, evaluateTermsAcceptance } from "@feudo/core";

import { getDb } from "@/db/client";
import { getAuth } from "./auth";
import { readRegistrationMode } from "./env";
import { TERMS_VERSION } from "./terms";
import { recordTermsAcceptance } from "./terms-repository";

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
  termsAccepted: boolean;
};

export type SignUpOutcome =
  | { status: "ok"; userId: string }
  | { status: "terms_not_accepted" }
  | { status: "registration_closed" }
  | { status: "invite_required" }
  | { status: "sign_up_failed" };

export async function signUp(input: SignUpInput, requestHeaders: Headers): Promise<SignUpOutcome> {
  const termsDecision = evaluateTermsAcceptance(input.termsAccepted);
  if (!termsDecision.accepted) {
    return { status: "terms_not_accepted" };
  }

  const registrationDecision = evaluateRegistrationMode(readRegistrationMode(), false);
  if (!registrationDecision.allowed) {
    return {
      status:
        registrationDecision.reason === "registration_closed"
          ? "registration_closed"
          : "invite_required",
    };
  }

  try {
    const result = await getAuth().api.signUpEmail({
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
        callbackURL: "/entrar",
      },
      headers: requestHeaders,
    });

    await recordTermsAcceptance(getDb(), result.user.id, TERMS_VERSION);

    return { status: "ok", userId: result.user.id };
  } catch (error) {
    if (error instanceof APIError) {
      return { status: "sign_up_failed" };
    }
    throw error;
  }
}

export type SignInInput = { email: string; password: string };

export type SignInOutcome =
  { status: "ok" } | { status: "invalid_credentials" } | { status: "email_not_verified" };

export async function signIn(input: SignInInput, requestHeaders: Headers): Promise<SignInOutcome> {
  try {
    await getAuth().api.signInEmail({ body: input, headers: requestHeaders });
    return { status: "ok" };
  } catch (error) {
    if (error instanceof APIError) {
      return { status: error.statusCode === 403 ? "email_not_verified" : "invalid_credentials" };
    }
    throw error;
  }
}

export type ResendVerificationOutcome = { status: "ok" } | { status: "failed" };

export async function resendVerification(email: string): Promise<ResendVerificationOutcome> {
  try {
    await getAuth().api.sendVerificationEmail({ body: { email, callbackURL: "/entrar" } });
    return { status: "ok" };
  } catch (error) {
    if (error instanceof APIError) {
      return { status: "failed" };
    }
    throw error;
  }
}

export async function signOut(requestHeaders: Headers): Promise<void> {
  await getAuth().api.signOut({ headers: requestHeaders });
}
