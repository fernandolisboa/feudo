import type { APIRequestContext, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export function uniqueEmail(prefix: string): string {
  const suffix = `${Date.now().toString()}-${Math.floor(Math.random() * 1e6).toString()}`;
  return `${prefix}-${suffix}@example.com`;
}

// An email sent in the background can land after the call that triggered it
// returns, so a caller expecting a specific email (not just the latest one,
// which may still be the verification email) passes the link it expects.
export async function lastEmailLink(
  request: APIRequestContext,
  baseURL: string,
  to: string,
  linkPattern: RegExp = /./,
): Promise<string> {
  const url = `${baseURL}/api/test-only/last-email?to=${encodeURIComponent(to)}`;
  let link: string | undefined;
  await expect
    .poll(
      async () => {
        const response = await request.get(url);
        if (response.status() !== 200) {
          return false;
        }
        const body = (await response.json()) as { text: string };
        link = /https?:\/\/\S+/.exec(body.text)?.[0];
        return link !== undefined && linkPattern.test(link);
      },
      { message: "email was not persisted in time", timeout: 30_000, intervals: [500] },
    )
    .toBe(true);
  if (!link) {
    throw new Error("email did not contain a link");
  }
  return link;
}

// Better Auth's own default rate limit on /sign-in and /sign-up is a strict,
// IP-keyed 3 requests per 10s (ADR-0001, deliberately not overridden) —
// several e2e files signing up or in around the same moment share that
// bucket and can get a 429, which never navigates. A fixed backoff would
// resynchronize every retrying file onto the same next attempt, recreating
// the same collision one window later; a randomized one spreads them out
// instead. Retrying past the window, rather than loosening the limit or
// serializing the whole e2e run, keeps the production rate limit intact and
// only spends extra time on an actual collision.
//
// A React 19 action-backed <form> also clears its own uncontrolled inputs
// after every submission, success or failure, and refilling it in place
// races that in-progress reset. Reloading the starting page before each
// retry (not just the first attempt) gives every retry a pristine, freshly
// rendered form instead.
const SIGN_UP_OR_IN_RETRY_ATTEMPTS = 3;

function randomBackoffMs(): number {
  return 10_000 + Math.floor(Math.random() * 6_000);
}

async function fillAndAwaitNavigation(
  page: Page,
  startUrl: string,
  fill: () => Promise<void>,
  buttonName: string,
  urlPattern: RegExp,
): Promise<void> {
  for (let attempt = 0; attempt < SIGN_UP_OR_IN_RETRY_ATTEMPTS; attempt += 1) {
    // A submit that actually succeeded but navigated after the previous
    // attempt's 5s window (e.g. a 429 the server retried into a slow
    // success) already reached the target URL — checking here, before any
    // goto/fill, catches that success even if it lands during the
    // back-off. Reading page.url() is synchronous, so checking on the
    // first attempt too costs nothing.
    if (urlPattern.test(page.url())) {
      return;
    }
    if (attempt > 0) {
      await page.goto(startUrl);
    }
    await fill();
    await page.getByRole("button", { name: buttonName }).click();
    try {
      await expect(page).toHaveURL(urlPattern, { timeout: 5_000 });
      return;
    } catch (error) {
      if (attempt === SIGN_UP_OR_IN_RETRY_ATTEMPTS - 1) {
        throw error;
      }
      await page.waitForTimeout(randomBackoffMs());
    }
  }
}

// Stops at /entrar, right after email verification — the shared prefix
// registration, magic-link and the invite-accept flow all need, each
// signing in differently from there.
export async function signUpAndVerify(
  page: Page,
  request: APIRequestContext,
  baseURL: string,
  options: { name: string; email: string; password: string },
): Promise<void> {
  await page.goto("/registrar");
  await fillAndAwaitNavigation(
    page,
    "/registrar",
    async () => {
      await page.getByLabel("Nome").fill(options.name);
      await page.getByLabel("E-mail").fill(options.email);
      await page.getByLabel("Senha").fill(options.password);
      await page
        .getByRole("checkbox", { name: "Aceito os termos de uso e a política de privacidade" })
        .check();
    },
    "Criar cadastro",
    /\/verificar-email\?email=/,
  );

  const verificationLink = await lastEmailLink(request, baseURL, options.email);
  await page.goto(verificationLink);
  await expect(page).toHaveURL(/\/entrar/);
}

// Stops at /comecar, right after signing in with a password, before any
// household exists.
export async function signUpAndSignIn(
  page: Page,
  request: APIRequestContext,
  baseURL: string,
  options: { name: string; email: string; password: string },
): Promise<void> {
  await signUpAndVerify(page, request, baseURL, options);
  await signInWithPassword(page, options, /\/comecar$/);
}

// Expects to start at /entrar.
export async function signInWithPassword(
  page: Page,
  options: { email: string; password: string },
  landsOn: RegExp,
): Promise<void> {
  await fillAndAwaitNavigation(
    page,
    "/entrar",
    async () => {
      await page.getByLabel("E-mail").fill(options.email);
      await page.getByLabel("Senha").fill(options.password);
    },
    "Entrar",
    landsOn,
  );
}

// Expects to start at /esqueci-a-senha. The request shares Better Auth's
// IP-keyed rate limit the same way sign-in and sign-up do, so a 429 backs off
// and retries on a freshly loaded form rather than failing the run.
export async function requestPasswordReset(page: Page, email: string): Promise<void> {
  const sent = page.getByText(
    "Se este e-mail tiver cadastro, enviamos um link para redefinir a senha.",
  );
  const rateLimited = page.getByText("Muitas tentativas. Tente novamente em instantes.");
  for (let attempt = 0; attempt < SIGN_UP_OR_IN_RETRY_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await page.waitForTimeout(randomBackoffMs());
      await page.goto("/esqueci-a-senha");
    }
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Enviar link" }).click();
    await expect(sent.or(rateLimited)).toBeVisible();
    if (await sent.isVisible()) {
      return;
    }
  }
  throw new Error("password reset request stayed rate limited");
}

// Expects to start at /entrar; the same rate-limit back-off as above.
export async function expectSignInRefused(
  page: Page,
  options: { email: string; password: string },
): Promise<void> {
  const refused = page.getByText("E-mail ou senha incorretos.");
  const rateLimited = page.getByText("Muitas tentativas. Tente novamente em instantes.");
  for (let attempt = 0; attempt < SIGN_UP_OR_IN_RETRY_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await page.waitForTimeout(randomBackoffMs());
      await page.goto("/entrar");
    }
    await page.getByLabel("E-mail").fill(options.email);
    await page.getByLabel("Senha").fill(options.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(refused.or(rateLimited)).toBeVisible();
    if (await refused.isVisible()) {
      await expect(page).toHaveURL(/\/entrar/);
      return;
    }
  }
  throw new Error("sign-in stayed rate limited");
}

export async function createHouseholdOnboarding(
  page: Page,
  name: string,
  options: { keepTutorials?: boolean } = {},
): Promise<void> {
  await page.getByLabel("Nome da casa").fill(name);
  await page.getByRole("button", { name: "Criar casa" }).click();
  await expect(page).toHaveURL(/\/$/);
  if (!options.keepTutorials) {
    await turnOffTutorials(page);
  }
}

// A new user's first visit to each screen starts that screen's guided tour,
// whose scrim covers the page. Specs that test something else turn the tours
// off once, from the first one, so no later screen is covered either.
export async function turnOffTutorials(page: Page): Promise<void> {
  const recorded = waitForTourOutcome(page);
  await page.getByRole("button", { name: "Não mostrar tutoriais" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await recorded;
}

// Closing a tour stores its outcome through a server action the page does not
// await; a navigation that wins the race drops the write and the tour returns.
export function waitForTourOutcome(page: Page): Promise<unknown> {
  return page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.request().headers()["next-action"] !== undefined,
  );
}

export async function signUpVerifyAndSignIn(
  page: Page,
  request: APIRequestContext,
  baseURL: string,
  options: { name: string; email: string; password: string },
): Promise<void> {
  await signUpAndSignIn(page, request, baseURL, options);
  await createHouseholdOnboarding(page, `Casa de ${options.name}`);
}
