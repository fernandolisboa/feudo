import { expect, test } from "@playwright/test";

import { createHouseholdOnboarding, signUpAndSignIn, uniqueEmail } from "./support/auth";

test("sign-up, verification, login, onboarding and sign-out", async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("baseURL is not configured for this Playwright project");
  }
  // Shares Better Auth's sign-up/sign-in rate-limit window with the other
  // e2e files (support/auth.ts); give a collision's retry room to land.
  test.slow();

  await signUpAndSignIn(page, request, baseURL, {
    name: "Playwright User",
    email: uniqueEmail("registration"),
    password: "correct-horse-battery-staple",
  });
  await createHouseholdOnboarding(page, "Casa do Playwright");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Olá, Playwright User." })).toBeVisible();

  await page.getByRole("button", { name: "Playwright User" }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();

  await expect(page).toHaveURL(/\/entrar/);
});
