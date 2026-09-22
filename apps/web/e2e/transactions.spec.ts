import { expect, test } from "@playwright/test";

import { signUpVerifyAndSignIn, uniqueEmail } from "./support/auth";

// The preview runs DATA_PROVIDER=fake: this item id resolves to "Banco
// Fixture", whose checking account carries three transactions in September
// 2026 (src/modules/sync/provider/fake-fixtures.ts).
const FAKE_ITEM_BANCO_FIXTURE = "0f1e2d3c-4b5a-4a6b-8c7d-8e9f0a1b2c3d";

test("transactions synced on connect, by month and by account", async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("baseURL is not configured for this Playwright project");
  }
  test.setTimeout(180_000);

  const member = {
    name: "Ledger E2E",
    email: uniqueEmail("transactions"),
    password: "correct-horse-battery-staple",
  };

  await page.setViewportSize({ width: 1280, height: 900 });
  await signUpVerifyAndSignIn(page, request, baseURL, member);

  await page.goto("/transacoes");
  await expect(
    page.getByText("Conecte um banco para ver as transações da casa aqui."),
  ).toBeVisible();
  await page.getByRole("link", { name: "Conectar banco" }).click();
  await page.getByRole("checkbox", { name: "Li e autorizo o Feudo" }).check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Já tenho minhas credenciais" }).click();
  await page.getByLabel("Client id").fill("e2e-client-id");
  await page.getByLabel("Client secret").fill("e2e-client-secret");
  await page.getByLabel("Item ID da conexão").fill(FAKE_ITEM_BANCO_FIXTURE);
  await page.getByRole("button", { name: "Conectar e sincronizar" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/transacoes?mes=2026-09");
  await expect(
    page.getByRole("heading", { name: "3 transações em setembro de 2026" }),
  ).toBeVisible();
  const salary = page.getByRole("row", { name: /PIX RECEBIDO EMPRESA FIXTURE/ });
  await expect(salary).toContainText("15/09/2026");
  await expect(salary).toContainText("Banco Fixture · Conta corrente");
  await expect(salary).toContainText("R$ 8.500,00");
  await expect(page.getByRole("row", { name: /PIX ENVIADO CONDOMINIO/ })).toContainText(
    "-R$ 980,50",
  );
  await expect(page.getByRole("row", { name: /COMPRA CARTAO MERCADO/ })).toContainText(
    "-R$ 212,30",
  );

  await page.getByRole("combobox", { name: "Conta" }).click();
  await page.getByRole("option", { name: "Banco Fixture · Poupança" }).click();
  await expect(page).toHaveURL(/mes=2026-09&conta=/);
  await expect(
    page.getByRole("heading", { name: "Nenhuma transação em setembro de 2026" }),
  ).toBeVisible();
  await expect(page.getByText("Nada registrado em setembro de 2026.")).toBeVisible();

  await page.getByRole("link", { name: "Mês anterior" }).click();
  await expect(page).toHaveURL(/mes=2026-08/);
  await expect(
    page.getByRole("heading", { name: "Nenhuma transação em agosto de 2026" }),
  ).toBeVisible();
});
