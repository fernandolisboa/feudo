import { expect, test } from "@playwright/test";

function uniqueEmail(): string {
  const suffix = `${Date.now().toString()}-${Math.floor(Math.random() * 1e6).toString()}`;
  return `e2e-magic-link-${suffix}@example.com`;
}

async function lastEmailLink(
  request: import("@playwright/test").APIRequestContext,
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

test("sign in with a magic link after signing up with a password", async ({
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
  await page.getByLabel("Nome").fill("Playwright Magic Link User");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page
    .getByRole("checkbox", { name: "Aceito os termos de uso e a política de privacidade" })
    .check();
  await page.getByRole("button", { name: "Criar cadastro" }).click();
  await expect(page).toHaveURL(/\/verificar-email\?email=/);

  const verificationLink = await lastEmailLink(request, baseURL, email);
  await page.goto(verificationLink);
  await expect(page).toHaveURL(/\/entrar/);

  await page.getByRole("link", { name: "Entrar com link por e-mail" }).click();
  await expect(page).toHaveURL(/\/entrar\/link-magico/);

  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByText("Se este e-mail tiver cadastro")).toBeVisible();

  const magicLink = await lastEmailLink(request, baseURL, email);
  await page.goto(magicLink);

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "Olá, Playwright Magic Link User." }),
  ).toBeVisible();
});
