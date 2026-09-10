import type { APIRequestContext, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export function uniqueEmail(prefix: string): string {
  const suffix = `${Date.now().toString()}-${Math.floor(Math.random() * 1e6).toString()}`;
  return `${prefix}-${suffix}@example.com`;
}

export async function lastEmailLink(
  request: APIRequestContext,
  baseURL: string,
  to: string,
): Promise<string> {
  const url = `${baseURL}/api/test-only/last-email?to=${encodeURIComponent(to)}`;
  await expect
    .poll(
      async () => {
        const response = await request.get(url);
        return response.status();
      },
      { message: "email was not persisted in time", timeout: 30_000, intervals: [500] },
    )
    .toBe(200);
  const response = await request.get(url);
  const body = (await response.json()) as { text: string };
  const linkMatch = /https?:\/\/\S+/.exec(body.text);
  if (!linkMatch) {
    throw new Error("email did not contain a link");
  }
  return linkMatch[0];
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

  await fillAndAwaitNavigation(
    page,
    "/entrar",
    async () => {
      await page.getByLabel("E-mail").fill(options.email);
      await page.getByLabel("Senha").fill(options.password);
    },
    "Entrar",
    /\/comecar$/,
  );
}

export async function createHouseholdOnboarding(page: Page, name: string): Promise<void> {
  await page.getByLabel("Nome da casa").fill(name);
  await page.getByRole("button", { name: "Criar casa" }).click();
  await expect(page).toHaveURL(/\/$/);
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
