import { expect, test } from "@playwright/test";

function uniqueEmail(): string {
  const suffix = `${Date.now().toString()}-${Math.floor(Math.random() * 1e6).toString()}`;
  return `e2e-${suffix}@example.com`;
}

test("sign-up, verification, login, onboarding and sign-out", async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("baseURL is not configured for this Playwright project");
  }

  const email = uniqueEmail();
  const password = "correct-horse-battery-staple";

  await page.goto("/registrar");
  await page.getByLabel("Nome").fill("Playwright User");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page
    .getByRole("checkbox", { name: "Aceito os termos de uso e a política de privacidade" })
    .check();
  await page.getByRole("button", { name: "Criar cadastro" }).click();

  await expect(page).toHaveURL(/\/verificar-email\?email=/);

  const lastEmailUrl = `${baseURL}/api/test-only/last-email?to=${encodeURIComponent(email)}`;
  await expect
    .poll(
      async () => {
        const response = await request.get(lastEmailUrl);
        return response.status();
      },
      {
        message: "verification email was not persisted in time",
        timeout: 30_000,
        intervals: [500],
      },
    )
    .toBe(200);
  const lastEmailResponse = await request.get(lastEmailUrl);
  const lastEmail = (await lastEmailResponse.json()) as { text: string };

  const linkMatch = /https?:\/\/\S+/.exec(lastEmail.text);
  if (!linkMatch) {
    throw new Error("verification email did not contain a link");
  }

  await page.goto(linkMatch[0]);
  await expect(page).toHaveURL(/\/entrar/);

  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/comecar$/);
  await page.getByLabel("Nome da casa").fill("Casa do Playwright");
  await page.getByRole("button", { name: "Criar casa" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Olá, Playwright User." })).toBeVisible();

  await page.getByRole("button", { name: "Sair" }).click();

  await expect(page).toHaveURL(/\/entrar/);
});
