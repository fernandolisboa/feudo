import { evaluateRegistrationMode } from "@feudo/core";

import { getAuth } from "./auth";
import { readAuthBaseUrl, readRegistrationMode } from "./env";
import { TERMS_VERSION } from "./terms";

const AUTH_BASE_PATH = "/api/auth";

function logAuthHandlerError(error: unknown): void {
  console.error(
    "auth handler request failed",
    error instanceof Error ? error.name : "UnknownError",
  );
}

function buildAuthRequest(path: string, body: unknown, requestHeaders: Headers): Request {
  const url = new URL(`${AUTH_BASE_PATH}${path}`, readAuthBaseUrl());
  const headers = new Headers(requestHeaders);
  headers.set("content-type", "application/json");
  return new Request(url, { method: "POST", headers, body: JSON.stringify(body) });
}

async function callAuthHandler(
  path: string,
  body: unknown,
  requestHeaders: Headers,
): Promise<Response | undefined> {
  try {
    return await getAuth().handler(buildAuthRequest(path, body, requestHeaders));
  } catch (error) {
    logAuthHandlerError(error);
    return undefined;
  }
}

async function readJson<T>(response: Response): Promise<T | undefined> {
  try {
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

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
  | { status: "rate_limited" }
  | { status: "sign_up_failed" };

export async function signUp(input: SignUpInput, requestHeaders: Headers): Promise<SignUpOutcome> {
  if (!input.termsAccepted) {
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

  const response = await callAuthHandler(
    "/sign-up/email",
    {
      name: input.name,
      email: input.email,
      password: input.password,
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: new Date().toISOString(),
      callbackURL: "/entrar",
    },
    requestHeaders,
  );

  if (!response) {
    return { status: "sign_up_failed" };
  }

  if (response.status === 429) {
    return { status: "rate_limited" };
  }

  if (!response.ok) {
    const body = await readJson<{ message?: string }>(response);
    if (body?.message === "registration_closed") {
      return { status: "registration_closed" };
    }
    if (body?.message === "invite_required") {
      return { status: "invite_required" };
    }
    if (body?.message === "terms_not_accepted") {
      return { status: "terms_not_accepted" };
    }
    return { status: "sign_up_failed" };
  }

  const body = await readJson<{ user?: { id?: string } }>(response);
  if (!body?.user?.id) {
    return { status: "sign_up_failed" };
  }
  return { status: "ok", userId: body.user.id };
}

export type SignInInput = { email: string; password: string };

export type SignInOutcome =
  | { status: "ok" }
  | { status: "invalid_credentials" }
  | { status: "email_not_verified" }
  | { status: "rate_limited" }
  | { status: "failed" };

export async function signIn(input: SignInInput, requestHeaders: Headers): Promise<SignInOutcome> {
  const response = await callAuthHandler("/sign-in/email", input, requestHeaders);

  if (!response) {
    return { status: "failed" };
  }

  if (response.status === 429) {
    return { status: "rate_limited" };
  }

  if (!response.ok) {
    return { status: response.status === 403 ? "email_not_verified" : "invalid_credentials" };
  }

  return { status: "ok" };
}

export type ResendVerificationOutcome =
  { status: "ok" } | { status: "rate_limited" } | { status: "failed" };

export async function resendVerification(
  email: string,
  requestHeaders: Headers,
): Promise<ResendVerificationOutcome> {
  const response = await callAuthHandler(
    "/send-verification-email",
    { email, callbackURL: "/entrar" },
    requestHeaders,
  );

  if (!response) {
    return { status: "failed" };
  }

  if (response.status === 429) {
    return { status: "rate_limited" };
  }

  if (!response.ok) {
    return { status: "failed" };
  }

  return { status: "ok" };
}

export async function signOut(requestHeaders: Headers): Promise<void> {
  await getAuth().api.signOut({ headers: requestHeaders });
}
