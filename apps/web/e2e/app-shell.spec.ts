import { expect, test } from "@playwright/test";

import { signUpVerifyAndSignIn, uniqueEmail } from "./support/auth";

test("the app shell: sidebar (open, collapsed), topnav and mobile bottom tabs", async ({
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

  await page.setViewportSize({ width: 1280, height: 900 });
  await signUpVerifyAndSignIn(page, request, baseURL, {
    name: "Shell User",
    email: uniqueEmail("app-shell"),
    password: "correct-horse-battery-staple",
  });

  const sidebar = page.locator('nav.app-shell-nav[data-shell="sidebar"]');

  await test.step("sidebar renders open by default", async () => {
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveAttribute("data-collapsed", "false");
    await expect(page.getByRole("link", { name: "Transações" })).toBeVisible();
    await expect(page.locator(".app-shell-tabbar")).toBeHidden();

    const openBox = await sidebar.boundingBox();
    expect(openBox?.width).toBe(224);
  });

  await test.step("sidebar collapses and the collapsed state survives a reload", async () => {
    await page.getByRole("button", { name: "Recolher menu" }).click();
    await expect(sidebar).toHaveAttribute("data-collapsed", "true");

    const collapsedBox = await sidebar.boundingBox();
    expect(collapsedBox?.width).toBe(64);

    await page.reload();
    const reloadedSidebar = page.locator('nav.app-shell-nav[data-shell="sidebar"]');
    await expect(reloadedSidebar).toHaveAttribute("data-collapsed", "true");
    const reloadedBox = await reloadedSidebar.boundingBox();
    expect(reloadedBox?.width).toBe(64);
  });

  await test.step("switching to the sala theme renders a topnav instead of a sidebar", async () => {
    await page.goto("/preferencias");
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Sala" }).click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "sala");
    await expect(page.locator('nav.app-shell-nav[data-shell="topnav"]')).toBeVisible();
    await expect(page.locator('nav.app-shell-nav[data-shell="sidebar"]')).toHaveCount(0);
  });

  await test.step("under 768px, a bottom tab bar replaces the sidebar or topnav", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator(".app-shell-tabbar")).toBeVisible();
    await expect(page.locator('nav.app-shell-nav[data-shell="topnav"]')).toBeHidden();
  });
});
