import { expect, test } from "@playwright/test";

import { signUpVerifyAndSignIn, uniqueEmail } from "./support/auth";

// The preview runs DATA_PROVIDER=fake: any client id and secret are accepted
// and this item id resolves to the "Banco Fixture" fixtures
// (src/modules/sync/provider/fake-fixtures.ts).
const FAKE_ITEM_BANCO_FIXTURE = "0f1e2d3c-4b5a-4a6b-8c7d-8e9f0a1b2c3d";

test("consent, wizard, synced accounts, relabel and credential removal", async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("baseURL is not configured for this Playwright project");
  }
  test.setTimeout(180_000);

  const member = {
    name: "Bank E2E",
    email: uniqueEmail("bank-connection"),
    password: "correct-horse-battery-staple",
  };

  await page.setViewportSize({ width: 1280, height: 900 });
  await signUpVerifyAndSignIn(page, request, baseURL, member);

  await expect(page.getByText("Nenhuma conta ainda.")).toBeVisible();
  await page.getByRole("link", { name: "Conectar banco" }).click();
  await expect(page).toHaveURL(/\/conectar-banco$/);

  await expect(page.getByRole("heading", { name: "Antes de conectar um banco" })).toBeVisible();
  await page.getByRole("checkbox", { name: "Li e autorizo o Feudo" }).check();
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByRole("heading", { name: "Configure o Meu Pluggy" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Abrir o Meu Pluggy" })).toHaveAttribute(
    "href",
    "https://meu.pluggy.ai",
  );
  await expect(page.getByRole("link", { name: "Abrir o Pluggy Dashboard" })).toHaveAttribute(
    "href",
    "https://dashboard.pluggy.ai",
  );
  await page.getByRole("button", { name: "Já tenho minhas credenciais" }).click();

  await expect(page.getByRole("heading", { name: "Cole suas credenciais" })).toBeVisible();
  await page.getByLabel("Client id").fill("e2e-client-id");
  await page.getByLabel("Client secret").fill("e2e-client-secret");
  await page.getByLabel("Item ID da conexão").fill(FAKE_ITEM_BANCO_FIXTURE);
  await page.getByRole("button", { name: "Conectar e sincronizar" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Contas", exact: true })).toBeVisible();
  const contaCorrente = page
    .getByRole("row")
    .filter({ has: page.getByRole("button", { name: "Ações: Conta corrente" }) });
  await expect(contaCorrente).toContainText("R$ 1.234,56");
  await expect(contaCorrente).toContainText("Conta individual");
  await expect(page.getByRole("row", { name: /CDB Fixture 110% CDI/ })).toContainText(
    "Investimento",
  );
  await expect(page.getByRole("heading", { name: "Contas em outras moedas" })).toBeVisible();
  await expect(page.getByRole("row", { name: /Conta global/ })).toContainText("US$ 120,00");
  await expect(page.getByText("Credenciais do Meu Pluggy salvas em")).toBeVisible();
  await expect(page.getByText("e2e-client-secret")).toHaveCount(0);

  await contaCorrente.getByRole("button", { name: "Ações: Conta corrente" }).click();
  await page.getByRole("menuitem", { name: "Marcar como conta da casa" }).click();
  await expect(contaCorrente).toContainText("Conta da casa");

  await page.getByRole("button", { name: "Remover credenciais" }).click();
  await page.getByRole("button", { name: "Remover", exact: true }).click();
  await expect(page.getByText("Você não tem credenciais do Meu Pluggy salvas.")).toBeVisible();
  await expect(page.getByText("Sincronização interrompida")).toBeVisible();
  await expect(contaCorrente).toBeVisible();
});
