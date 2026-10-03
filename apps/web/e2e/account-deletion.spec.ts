import { expect, test } from "@playwright/test";

import { signInWithPassword, signUpVerifyAndSignIn, uniqueEmail } from "./support/auth";

test("account deletion signs out at once and can be cancelled by signing in again", async ({
  page,
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
    name: "Exclusão",
    email: uniqueEmail("account-deletion"),
    password: "correct-horse-battery-staple",
  };
  await signUpVerifyAndSignIn(page, request, baseURL, credentials);

  await page.goto("/preferencias");
  await page.getByRole("button", { name: "Excluir meu cadastro" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(`Casa de ${credentials.name}`, { exact: false })).toBeVisible();
  await dialog.getByRole("button", { name: "Excluir meu cadastro" }).click();

  await expect(page).toHaveURL(/\/exclusao-agendada$/);
  await expect(page.getByText("Recebemos seu pedido.")).toBeVisible();

  await page.goto("/");
  await expect(page).toHaveURL(/\/entrar/);

  await signInWithPassword(page, credentials, /\/exclusao-agendada$/);
  await expect(page.getByText(/^Seu cadastro será apagado em /)).toBeVisible();

  await page.getByRole("button", { name: "Cancelar exclusão" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(/^Visão geral · /)).toBeVisible();
});
