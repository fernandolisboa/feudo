import { expect, test } from "@playwright/test";

import {
  expectSignInRefused,
  lastEmailLink,
  requestPasswordReset,
  signInWithPassword,
  signUpVerifyAndSignIn,
  uniqueEmail,
} from "./support/auth";

test("reset a forgotten password by email: the new one signs in, the old one and old sessions stop working, the link works once", async ({
  page,
  browser,
  request,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("baseURL is not configured for this Playwright project");
  }
  // Signs up and then in again, sharing Better Auth's sign-in rate-limit
  // window with the other e2e files (support/auth.ts).
  test.slow();

  const credentials = {
    name: "Senha E2E",
    email: uniqueEmail("password-reset"),
    password: "correct-horse-battery-staple",
  };
  const newPassword = "staple-battery-horse-correct";
  await signUpVerifyAndSignIn(page, request, baseURL, credentials);

  const resetContext = await browser.newContext();
  const resetPage = await resetContext.newPage();
  await resetPage.goto("/entrar");
  await resetPage.getByRole("link", { name: "Esqueci minha senha" }).click();
  await expect(resetPage).toHaveURL(/\/esqueci-a-senha$/);
  await requestPasswordReset(resetPage, credentials.email);

  const resetLink = await lastEmailLink(request, baseURL, credentials.email, /\/reset-password\//);
  await resetPage.goto(resetLink);
  await expect(resetPage).toHaveURL(/\/redefinir-senha$/);
  await expect(resetPage.getByRole("heading", { name: "Defina uma nova senha" })).toBeVisible();
  await resetPage.getByLabel("Nova senha").fill(newPassword);
  await resetPage.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(resetPage).toHaveURL(/\/entrar$/);

  await expectSignInRefused(resetPage, credentials);
  await resetPage.goto("/entrar");
  await signInWithPassword(resetPage, { email: credentials.email, password: newPassword }, /\/$/);
  await expect(resetPage.getByText(/^Visão geral · /)).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/entrar/);

  await resetPage.goto(resetLink);
  await expect(
    resetPage.getByText("Este link é inválido ou expirou. Peça um novo link."),
  ).toBeVisible();

  await resetContext.close();
});
