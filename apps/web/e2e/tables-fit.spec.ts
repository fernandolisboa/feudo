import { expect, test, type Page } from "@playwright/test";

import { signUpVerifyAndSignIn, uniqueEmail } from "./support/auth";

// DATA_PROVIDER=fake on the preview: "Banco Fixture" brings checking, savings,
// a card, a foreign account and two investments (fake-fixtures.ts).
const FAKE_ITEM_BANCO_FIXTURE = "0f1e2d3c-4b5a-4a6b-8c7d-8e9f0a1b2c3d";

const PAGES = ["/?aba=contas", "/transacoes?mes=2026-09", "/reserva", "/casa"];

async function sidewaysOverflow(page: Page): Promise<number[]> {
  return page.evaluate(() => [
    document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ...[...document.querySelectorAll("[data-slot=table-container]")].map(
      (container) => container.scrollWidth - container.clientWidth,
    ),
  ]);
}

test("tables fit the screen: no sideways scroll, rows become cards on a phone", async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("baseURL is not configured for this Playwright project");
  }
  test.setTimeout(180_000);

  const member = {
    name: "Tables E2E",
    email: uniqueEmail("tables"),
    password: "correct-horse-battery-staple",
  };

  await page.setViewportSize({ width: 1280, height: 900 });
  await signUpVerifyAndSignIn(page, request, baseURL, member);

  await page.goto("/conectar-banco");
  await page.getByRole("checkbox", { name: "Li e autorizo o Feudo" }).check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Já tenho minhas credenciais" }).click();
  await page.getByLabel("Client id").fill("e2e-client-id");
  await page.getByLabel("Client secret").fill("e2e-client-secret");
  await page.getByLabel("Item ID da conexão").fill(FAKE_ITEM_BANCO_FIXTURE);
  await page.getByLabel("Nome do banco").fill("Banco Fixture com um nome bem comprido");
  await page.getByRole("button", { name: "Conectar e sincronizar" }).click();
  await expect(page).toHaveURL(/\/$/);

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of PAGES) {
      await page.goto(path);
      await expect(page.locator("[data-slot=table-container]").first()).toBeVisible();
      for (const overflow of await sidewaysOverflow(page)) {
        expect(overflow, `${path} at ${String(width)}px`).toBeLessThanOrEqual(0);
      }
    }
  }

  await page.goto("/?aba=contas");
  const accountRow = page
    .locator("[data-slot=table-container][data-stack] [data-slot=table-body] tr")
    .first();
  await expect(accountRow).toHaveCSS("display", "grid");
});
