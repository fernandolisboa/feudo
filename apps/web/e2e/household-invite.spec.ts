import { expect, test } from "@playwright/test";

import {
  createHouseholdOnboarding,
  lastEmailLink,
  signUpAndSignIn,
  signUpVerifyAndSignIn,
  uniqueEmail,
} from "./support/auth";

test("invite, accept by a second user, switch household and transfer ownership", async ({
  browser,
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("baseURL is not configured for this Playwright project");
  }
  // Two accounts means up to four sign-up/sign-in round trips, each capable
  // of retrying past Better Auth's shared 10s rate-limit window
  // (support/auth.ts) if it collides with another e2e file's traffic.
  test.setTimeout(240_000);

  const owner = {
    name: "Owner E2E",
    email: uniqueEmail("household-owner"),
    password: "correct-horse-battery-staple",
  };
  const invitee = {
    name: "Invitee E2E",
    email: uniqueEmail("household-invitee"),
    password: "correct-horse-battery-staple",
  };

  await page.setViewportSize({ width: 1280, height: 900 });
  await signUpVerifyAndSignIn(page, request, baseURL, owner);
  const ownerHouseholdName = `Casa de ${owner.name}`;

  const ownerSidebar = page.locator('nav.app-shell-nav[data-shell="sidebar"]');
  await ownerSidebar.getByRole("link", { name: "Casa" }).click();
  await expect(page).toHaveURL(/\/casa$/);

  await page.getByRole("button", { name: "Convidar" }).click();
  await page.getByLabel("E-mail").fill(invitee.email);
  await page.getByLabel("Papel").click();
  await page.getByRole("option", { name: "Administrador" }).click();
  await page.getByRole("button", { name: "Enviar convite" }).click();

  await expect(page.getByText(invitee.email)).toBeVisible();

  const inviteLink = await lastEmailLink(request, baseURL, invitee.email);

  const inviteeContext = await browser.newContext();
  const inviteePage = await inviteeContext.newPage();
  await inviteePage.setViewportSize({ width: 1280, height: 900 });
  await signUpAndSignIn(inviteePage, request, baseURL, invitee);
  const inviteeHouseholdName = `Casa de ${invitee.name}`;
  await createHouseholdOnboarding(inviteePage, inviteeHouseholdName);

  await inviteePage.goto(inviteLink);
  await expect(inviteePage.getByText(ownerHouseholdName)).toBeVisible();
  await expect(inviteePage.getByText("Administrador")).toBeVisible();
  await inviteePage.getByRole("button", { name: "Aceitar e entrar" }).click();

  await expect(inviteePage).toHaveURL(/\/$/);
  await expect(inviteePage.getByRole("heading", { name: `Olá, ${invitee.name}.` })).toBeVisible();

  const inviteeSidebar = inviteePage.locator('nav.app-shell-nav[data-shell="sidebar"]');
  const householdSwitcher = inviteeSidebar.getByLabel("Casa");
  await householdSwitcher.click();
  await expect(inviteePage.getByRole("option", { name: inviteeHouseholdName })).toBeVisible();
  await expect(inviteePage.getByRole("option", { name: ownerHouseholdName })).toBeVisible();
  await inviteePage.getByRole("option", { name: inviteeHouseholdName }).click();
  await expect(inviteePage).toHaveURL(/\/$/);

  await householdSwitcher.click();
  await inviteePage.getByRole("option", { name: ownerHouseholdName }).click();
  await expect(inviteePage).toHaveURL(/\/$/);

  await inviteeSidebar.getByRole("link", { name: "Casa" }).click();
  await expect(inviteePage).toHaveURL(/\/casa$/);
  await expect(inviteePage.getByText(invitee.name)).toBeVisible();

  await page.reload();
  await expect(page.getByText(invitee.name)).toBeVisible();
  const inviteeRow = page.getByRole("row", { name: new RegExp(invitee.name) });
  await inviteeRow.getByRole("button", { name: "Ações" }).click();

  const transferMenuItem = page.getByRole("menuitem", {
    name: `Transferir responsabilidade para ${invitee.name}`,
  });
  await expect(transferMenuItem).toBeVisible();
  await transferMenuItem.click();

  const transferConfirmButton = page.getByRole("button", { name: "Transferir" });
  await expect(transferConfirmButton).toBeVisible();
  await transferConfirmButton.click();

  const ownerRowAfterTransfer = page.getByRole("row", { name: new RegExp(owner.name) });
  await expect(ownerRowAfterTransfer.getByText("Administrador")).toBeVisible();
  const inviteeRowAfterTransfer = page.getByRole("row", { name: new RegExp(invitee.name) });
  await expect(inviteeRowAfterTransfer.getByText("Responsável")).toBeVisible();

  await inviteeContext.close();
});
