import { expect, test, type Page } from "@playwright/test";

import { signUpVerifyAndSignIn, uniqueEmail } from "./support/auth";

// The preview runs DATA_PROVIDER=fake: this item id resolves to "Banco Reserva
// Fixture" (src/modules/sync/provider/fake-fixtures.ts), named "Itaú" here so
// its positions resolve to an FGC member:
//   - Conta corrente R$ 2.000,00, paying R$ 1.500,00 of condo (a fixed cost)
//     two, three and four months before today, so the average fixed cost is
//     R$ 1.500,00 and the six-month target R$ 9.000,00 on any day.
//   - Poupança R$ 3.000,00 and a CDB at 100% of CDI, R$ 4.000,00, bought over
//     two years ago (15% income tax) with no liquidity the provider can tell.
// The e2e job seeds fixed indicators (scripts/seed-e2e-market-data.mjs): CDI
// and Selic 13,4% a year, Selic target 15%, IPCA 5% in 12 months.
const FAKE_ITEM_RESERVA_FIXTURE = "2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f";

async function connectReserveFixture(page: Page): Promise<void> {
  await page.getByRole("link", { name: "Conectar banco" }).first().click();
  await page.getByRole("checkbox", { name: "Li e autorizo o Feudo" }).check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Já tenho minhas credenciais" }).click();
  await page.getByLabel("Client id").fill("e2e-client-id");
  await page.getByLabel("Client secret").fill("e2e-client-secret");
  await page.getByLabel("Item ID da conexão").fill(FAKE_ITEM_RESERVA_FIXTURE);
  await page.getByLabel("Nome do banco").fill("Itaú");
  await page.getByRole("button", { name: "Conectar e sincronizar" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("reserve target, placement ranking, marking positions and coverage", async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("baseURL is not configured for this Playwright project");
  }
  test.setTimeout(180_000);

  const member = {
    name: "Reserva E2E",
    email: uniqueEmail("reserve"),
    password: "correct-horse-battery-staple",
  };

  await page.setViewportSize({ width: 1280, height: 900 });
  await signUpVerifyAndSignIn(page, request, baseURL, member);
  await connectReserveFixture(page);

  await page.goto("/reserva");
  await expect(page.getByRole("heading", { name: "Sua meta é R$ 9.000,00." })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Meses de reserva" })).toHaveText(/^6(?!\d)/);
  await expect(page.getByText("Custo fixo médio")).toBeVisible();
  await expect(page.getByText("R$ 1.500,00", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cobertura" })).toHaveCount(0);

  const monthlyTable = page
    .getByRole("table")
    .filter({ has: page.getByRole("columnheader", { name: "Custo fixo" }) });
  await expect(monthlyTable.getByRole("cell", { name: "R$ 1.500,00" })).toHaveCount(3);

  const ranking = page.getByRole("list", { name: "Onde colocar os próximos reais" });
  const alsoRanked = page.getByRole("list", { name: "Também avaliados" });
  await expect(ranking.getByRole("listitem")).toHaveCount(2);
  await expect(ranking.getByRole("listitem").nth(0)).toContainText("1º");
  await expect(ranking.getByRole("listitem").nth(0)).toContainText("Poupança");
  await expect(ranking.getByRole("listitem").nth(0)).toContainText("1,1% a.a.");
  await expect(ranking.getByRole("listitem").nth(1)).toContainText("Conta corrente");
  await expect(alsoRanked.getByRole("listitem")).toHaveCount(1);
  await expect(alsoRanked).toContainText("CDB Liquidez Diária 100% CDI");
  await expect(alsoRanked).toContainText("liquidez desconhecida, confirme em Ajustar");
  await expect(
    page.getByText("Taxas ao ano: CDI 13,4% · Selic 13,4% · IPCA em 12 meses 5%"),
  ).toBeVisible();

  const cdbRow = page.getByRole("row", { name: /^CDB Liquidez Diária 100% CDI/ });
  await expect(cdbRow).toContainText("confirme");
  await cdbRow.getByRole("button", { name: "Ajustar CDB Liquidez Diária 100% CDI" }).click();
  const cdbDialog = page.getByRole("dialog", { name: "CDB Liquidez Diária 100% CDI" });
  await cdbDialog.getByRole("switch", { name: "Faz parte da reserva" }).click();
  await cdbDialog.getByRole("combobox", { name: "Resgate" }).click();
  await page.getByRole("option", { name: "Em até 1 dia útil" }).click();
  await cdbDialog.getByRole("button", { name: "Salvar" }).click();
  await expect(cdbDialog).toHaveCount(0);

  await expect(cdbRow).toContainText("até D+1");
  await expect(cdbRow).toContainText("faz parte");
  await expect(ranking.getByRole("listitem")).toHaveCount(3);
  await expect(ranking.getByRole("listitem").nth(0)).toContainText("CDB Liquidez Diária 100% CDI");
  await expect(ranking.getByRole("listitem").nth(0)).toContainText("6,1% a.a.");
  await expect(alsoRanked).toHaveCount(0);

  const coverage = page.getByRole("progressbar", {
    name: "Quanto da meta da reserva está coberto",
  });
  await expect(page.getByText("R$ 4.000,00 de R$ 9.000,00")).toBeVisible();
  await expect(coverage).toBeVisible();

  const savingsRow = page.getByRole("row", { name: /^Poupança/ });
  await savingsRow.getByRole("button", { name: "Ajustar Poupança" }).click();
  const savingsDialog = page.getByRole("dialog", { name: "Poupança" });
  await savingsDialog.getByRole("switch", { name: "Faz parte da reserva" }).click();
  await savingsDialog.getByRole("button", { name: "Salvar" }).click();
  await expect(savingsDialog).toHaveCount(0);
  await expect(savingsRow).toContainText("faz parte");
  await expect(page.getByText("R$ 7.000,00 de R$ 9.000,00")).toBeVisible();

  await page.getByRole("combobox", { name: "Meses de reserva" }).click();
  await page.getByRole("option", { name: "3", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sua meta é R$ 4.500,00." })).toBeVisible();
  await expect(page.getByText("R$ 7.000,00 de R$ 4.500,00")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Sua meta é R$ 4.500,00." })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Meses de reserva" })).toHaveText(/^3(?!\d)/);
  await expect(cdbRow).toContainText("faz parte");
  await expect(savingsRow).toContainText("faz parte");
});
