import { expect, test } from "@playwright/test";

import { signUpVerifyAndSignIn, uniqueEmail } from "./support/auth";

// The preview runs DATA_PROVIDER=fake: this item id resolves to "Banco
// Fixture", whose checking account carries three transactions in September
// 2026 (src/modules/sync/provider/fake-fixtures.ts):
//   - PIX RECEBIDO EMPRESA FIXTURE, credit R$ 8.500,00, provider category
//     "Salary" -> income.salary (no default rule matches it, so the
//     provider-category mapping resolves it; kind income).
//   - PIX ENVIADO CONDOMINIO, debit -R$ 980,50, matched by the product
//     default rule for "CONDOMINIO" -> housing.condo (kind fixed), which
//     outranks its own provider category ("Housing", unmapped).
//   - COMPRA CARTAO MERCADO, debit -R$ 212,30, provider category "Groceries"
//     -> food.groceries (kind variable); no default rule matches "MERCADO".
// So income = R$ 8.500,00 and spending = R$ 980,50 + R$ 212,30 = R$ 1.192,80.
const FAKE_ITEM_BANCO_FIXTURE = "0f1e2d3c-4b5a-4a6b-8c7d-8e9f0a1b2c3d";

test("overview dashboard shows the month's headline and totals from the synced fixture", async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("baseURL is not configured for this Playwright project");
  }
  test.setTimeout(180_000);

  const member = {
    name: "Overview E2E",
    email: uniqueEmail("overview"),
    password: "correct-horse-battery-staple",
  };

  await page.setViewportSize({ width: 1280, height: 900 });
  await signUpVerifyAndSignIn(page, request, baseURL, member);

  await expect(page.getByText("Conecte um banco para ver os gastos da casa aqui.")).toBeVisible();
  await page.getByRole("link", { name: "Conectar banco" }).click();
  await page.getByRole("checkbox", { name: "Li e autorizo o Feudo" }).check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Já tenho minhas credenciais" }).click();
  await page.getByLabel("Client id").fill("e2e-client-id");
  await page.getByLabel("Client secret").fill("e2e-client-secret");
  await page.getByLabel("Item ID da conexão").fill(FAKE_ITEM_BANCO_FIXTURE);
  await page.getByRole("button", { name: "Conectar e sincronizar" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/?mes=2026-09");

  await expect(page.getByRole("heading", { name: /da renda em setembro de 2026/ })).toBeVisible();

  const overviewMain = page.locator("body");
  await expect(overviewMain.getByText("Renda").first()).toBeVisible();
  await expect(overviewMain.getByText("R$ 8.500,00").first()).toBeVisible();
  await expect(overviewMain.getByText("Gastos").first()).toBeVisible();
  await expect(overviewMain.getByText("R$ 1.192,80").first()).toBeVisible();
});
