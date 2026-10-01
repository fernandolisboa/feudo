import { expect, test } from "@playwright/test";

import { createHouseholdOnboarding, signUpAndSignIn, uniqueEmail } from "./support/auth";

test("a new user sees the Visão geral tour once, skips it, and reopens it from the menu", async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("baseURL is not configured for this Playwright project");
  }
  // Shares Better Auth's sign-up/sign-in rate-limit window with the other
  // e2e files (support/auth.ts); give a collision's retry room to land.
  test.slow();

  const member = {
    name: "Tour E2E",
    email: uniqueEmail("guided-tour"),
    password: "correct-horse-battery-staple",
  };

  await page.setViewportSize({ width: 1280, height: 900 });
  await signUpAndSignIn(page, request, baseURL, member);
  await createHouseholdOnboarding(page, `Casa de ${member.name}`, { keepTutorials: true });

  const firstStep = page.getByRole("dialog", { name: "Onde fica cada coisa" });

  await test.step("the tour starts on the first visit and moves with the keyboard", async () => {
    await expect(firstStep).toBeVisible();
    await expect(firstStep.getByText("1 de 4")).toBeVisible();
    await expect(firstStep.getByRole("button", { name: "Próximo" })).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Sua casa" })).toBeVisible();
  });

  await test.step("Esc skips the tour and it does not come back on reload", async () => {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole("heading", { name: "Contas", exact: true })).toBeVisible();
    // The tour would start as soon as the accounts section renders; give it
    // a moment to prove that it doesn't.
    await page.waitForTimeout(1_500);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  await test.step("the user menu reopens this screen's tour", async () => {
    await page.getByRole("button", { name: member.name }).click();
    await page.getByRole("menuitem", { name: "Ver tour desta tela" }).click();
    await expect(firstStep).toBeVisible();

    await firstStep.getByRole("button", { name: "Pular tour" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  await test.step("the mobile tour anchors to the bottom tabs", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: member.name }).click();
    await page.getByRole("menuitem", { name: "Ver tour desta tela" }).click();
    await expect(firstStep).toBeVisible();

    const tabBar = await page.locator(".app-shell-tabbar").boundingBox();
    const card = await firstStep.boundingBox();
    expect(tabBar).not.toBeNull();
    expect(card).not.toBeNull();
    if (tabBar && card) {
      expect(card.y + card.height).toBeLessThanOrEqual(tabBar.y);
    }
  });
});
