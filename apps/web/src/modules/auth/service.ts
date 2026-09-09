import { cookies } from "next/headers";
import { parseSetCookieHeader, toCookieOptions } from "better-auth/cookies";

import { getAuth } from "./auth";
import { readAuthBaseUrl } from "./env";
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

// nextCookies() only bridges auth.api.* calls; getAuth().handler() flags its
// context as router-driven and the plugin skips it. We go through the handler
// on purpose (docs/runbooks/auth.md) so the DB-backed rate limiter runs, so we
// bridge the cookies ourselves instead.
async function applyResponseCookies(response: Response): Promise<void> {
  const setCookieValues = response.headers.getSetCookie();
  if (setCookieValues.length === 0) {
    return;
  }

  let cookieStore: Awaited<ReturnType<typeof cookies>>;
  try {
    cookieStore = await cookies();
  } catch (error) {
    if (error instanceof Error && error.message.includes("outside a request scope")) {
      return;
    }
    throw error;
  }

  for (const setCookie of setCookieValues) {
    for (const [name, attributes] of parseSetCookieHeader(setCookie)) {
      try {
        cookieStore.set(name, attributes.value, toCookieOptions(attributes));
      } catch (error) {
        logCookieStoreError(name, error);
      }
    }
  }
}

function logCookieStoreError(cookieName: string, error: unknown): void {
  console.error(
    "auth handler failed to persist a cookie",
    cookieName,
    error instanceof Error ? error.name : "UnknownError",
  );
}

async function callAuthHandler(
  path: string,
  body: unknown,
  requestHeaders: Headers,
): Promise<Response | undefined> {
  try {
    const response = await getAuth().handler(buildAuthRequest(path, body, requestHeaders));
    await applyResponseCookies(response);
    return response;
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
  | { status: "ok" }
  | { status: "terms_not_accepted" }
  | { status: "registration_closed" }
  | { status: "invite_required" }
  | { status: "rate_limited" }
  | { status: "sign_up_failed" };

export async function signUp(input: SignUpInput, requestHeaders: Headers): Promise<SignUpOutcome> {
  if (!input.termsAccepted) {
    return { status: "terms_not_accepted" };
  }

  const response = await callAuthHandler(
    "/sign-up/email",
    {
      name: input.name,
      email: input.email,
      password: input.password,
      termsVersion: TERMS_VERSION,
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
  return { status: "ok" };
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

export type SimpleOutcome = { status: "ok" } | { status: "rate_limited" } | { status: "failed" };

function mapSimpleResponse(response: Response | undefined): SimpleOutcome {
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

// Shared by every flow that only ever emails a single-use link (resend
// verification, request magic link, request password reset): same request
// shape, same three-way outcome mapping. `minimumMs`, when set, pads the
// call to a constant floor so a caller cannot tell "email exists, sending
// took real time" apart from "email doesn't exist, nothing was sent" by
// timing the response; it never pads a rate-limited response, since that
// signal is already uniform across known and unknown addresses.
async function requestEmailFlow(
  path: string,
  body: unknown,
  requestHeaders: Headers,
  options: { minimumMs?: number } = {},
): Promise<SimpleOutcome> {
  const start = options.minimumMs !== undefined ? Date.now() : undefined;
  const response = await callAuthHandler(path, body, requestHeaders);
  const outcome = mapSimpleResponse(response);

  if (start !== undefined && outcome.status !== "rate_limited") {
    const remaining = (options.minimumMs as number) - (Date.now() - start);
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
  }

  return outcome;
}

export async function resendVerification(
  email: string,
  requestHeaders: Headers,
): Promise<SimpleOutcome> {
  return requestEmailFlow(
    "/send-verification-email",
    { email, callbackURL: "/entrar" },
    requestHeaders,
  );
}

export async function signOut(requestHeaders: Headers): Promise<void> {
  await callAuthHandler("/sign-out", {}, requestHeaders);
}

export async function requestMagicLink(
  email: string,
  requestHeaders: Headers,
): Promise<SimpleOutcome> {
  return requestEmailFlow(
    "/sign-in/magic-link",
    { email, callbackURL: "/", errorCallbackURL: "/entrar/link-magico" },
    requestHeaders,
  );
}

// Better Auth's own /send-verification-email pads unknown-user lookups to a
// 500ms floor for the same reason (a fast local check versus a slow email
// send would otherwise leak which addresses have an account);
// /request-password-reset has no such floor built in, so we add one here.
const REQUEST_PASSWORD_RESET_MINIMUM_MS = 500;

export async function requestPasswordReset(
  email: string,
  requestHeaders: Headers,
): Promise<SimpleOutcome> {
  return requestEmailFlow(
    "/request-password-reset",
    { email, redirectTo: "/redefinir-senha" },
    requestHeaders,
    { minimumMs: REQUEST_PASSWORD_RESET_MINIMUM_MS },
  );
}

export type ResetPasswordInput = { token: string; newPassword: string };

export type ResetPasswordOutcome =
  | { status: "ok" }
  | { status: "invalid_token" }
  | { status: "rate_limited" }
  | { status: "failed" };

export async function resetPassword(
  input: ResetPasswordInput,
  requestHeaders: Headers,
): Promise<ResetPasswordOutcome> {
  const response = await callAuthHandler("/reset-password", input, requestHeaders);

  if (!response) {
    return { status: "failed" };
  }

  if (response.status === 429) {
    return { status: "rate_limited" };
  }

  if (!response.ok) {
    const body = await readJson<{ code?: string }>(response);
    if (body?.code === "INVALID_TOKEN") {
      return { status: "invalid_token" };
    }
    return { status: "failed" };
  }

  return { status: "ok" };
}
