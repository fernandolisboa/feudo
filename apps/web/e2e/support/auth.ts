import type { APIRequestContext, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export function uniqueEmail(prefix: string): string {
  const suffix = `${Date.now().toString()}-${Math.floor(Math.random() * 1e6).toString()}`;
  return `${prefix}-${suffix}@example.com`;
}

export async function signUpVerifyAndSignIn(
  page: Page,
  request: APIRequestContext,
  baseURL: string,
  options: { name: string; email: string; password: string },
): Promise<void> {
  await page.goto("/registrar");
  await page.getByLabel("Nome").fill(options.name);
  await page.getByLabel("E-mail").fill(options.email);
  await page.getByLabel("Senha").fill(options.password);
  await page
    .getByRole("checkbox", { name: "Aceito os termos de uso e a política de privacidade" })
    .check();
  await page.getByRole("button", { name: "Criar cadastro" }).click();

  await expect(page).toHaveURL(/\/verificar-email\?email=/);

  const lastEmailUrl = `${baseURL}/api/test-only/last-email?to=${encodeURIComponent(options.email)}`;
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

  await page.getByLabel("E-mail").fill(options.email);
  await page.getByLabel("Senha").fill(options.password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/$/);
}
