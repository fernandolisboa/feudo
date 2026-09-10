import { expect, test } from "@playwright/test";

import { lastEmailLink, signUpAndVerify, uniqueEmail } from "./support/auth";

test("sign in with a magic link after signing up with a password", async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("baseURL is not configured for this Playwright project");
  }
  // Shares Better Auth's sign-up rate-limit window with the other e2e files
  // (support/auth.ts); give a collision's retry room to land.
  test.slow();

  const email = uniqueEmail("magic-link");
  const password = "correct-horse-battery-staple";

  await signUpAndVerify(page, request, baseURL, {
    name: "Playwright Magic Link User",
    email,
    password,
  });

  await page.getByRole("link", { name: "Entrar com link por e-mail" }).click();
  await expect(page).toHaveURL(/\/entrar\/link-magico/);

  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByText("Se este e-mail tiver cadastro")).toBeVisible();

  const magicLink = await lastEmailLink(request, baseURL, email);
  await page.goto(magicLink);

  // A freshly signed-up user has no household yet, so the session lands on
  // onboarding (docs/adr for household creation), not the dashboard; that
  // flow is covered end to end by registration.spec.ts.
  await expect(page).toHaveURL(/\/comecar$/);
  await expect(page.getByRole("heading", { name: "Crie sua casa" })).toBeVisible();
});
