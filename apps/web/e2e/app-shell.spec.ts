import { expect, test, type Page } from "@playwright/test";

import { signUpVerifyAndSignIn, uniqueEmail } from "./support/auth";

function expectWithinAPixel(actual: number | undefined, expected: number) {
  expect(Math.abs((actual ?? Number.NaN) - expected)).toBeLessThanOrEqual(1);
}

async function scrollToTheEndOfALongPage(page: Page) {
  await page.locator("main.app-shell-content").evaluate((main) => {
    const filler = document.createElement("div");
    filler.style.height = "4000px";
    main.append(filler);
  });
  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(3000);
}

test("the app shell: sidebar (open, collapsed), topnav, dock and mobile bottom tabs", async ({
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

  await test.step("the sidebar stays on screen while a long page scrolls", async () => {
    await scrollToTheEndOfALongPage(page);

    const box = await sidebar.boundingBox();
    expectWithinAPixel(box?.y, 0);
    expectWithinAPixel(box?.height, 900);
    await expect(page.getByRole("link", { name: "Transações" })).toBeInViewport();
    await expect(page.getByRole("button", { name: "Recolher menu" })).toBeInViewport();
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

  await test.step("the theme changes colours only, never the navigation", async () => {
    await page.goto("/preferencias");
    await page.getByRole("combobox", { name: "Tema" }).click();
    await page.getByRole("option", { name: /Lamparina/ }).click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "lamparina");
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect(page.locator('nav.app-shell-nav[data-shell="sidebar"]')).toBeVisible();
  });

  await test.step("the top-menu layout renders a topnav instead of a sidebar", async () => {
    await page.goto("/preferencias");
    await page.getByRole("combobox", { name: "Layout" }).click();
    await page.getByRole("option", { name: /Menu no topo/ }).click();

    await expect(page.locator('nav.app-shell-nav[data-shell="topnav"]')).toBeVisible();
    await expect(page.locator('nav.app-shell-nav[data-shell="sidebar"]')).toHaveCount(0);

    await scrollToTheEndOfALongPage(page);
    await expect(page.locator('nav.app-shell-nav[data-shell="topnav"]')).toBeInViewport();
  });

  await test.step("the floating-menu layout docks the navigation at the bottom", async () => {
    await page.goto("/preferencias");
    await page.getByRole("combobox", { name: "Layout" }).click();
    await page.getByRole("option", { name: /Menu flutuante/ }).click();

    const dock = page.locator('nav.app-shell-nav[data-shell="dock"]');
    await expect(dock).toBeVisible();
    await expect(page.locator('nav.app-shell-nav[data-shell="topnav"]')).toHaveCount(0);

    await scrollToTheEndOfALongPage(page);
    await expect(dock).toBeInViewport();
    await expect(dock.getByRole("link", { name: "Transações" })).toBeInViewport();
    const box = await dock.boundingBox();
    expectWithinAPixel(box ? box.y + box.height : undefined, 900 - 20);
  });

  await test.step("under 768px, the dock layout floats the bottom tab bar", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    const tabbar = page.locator(".app-shell-tabbar");
    await expect(tabbar).toBeVisible();
    await expect(page.locator('nav.app-shell-nav[data-shell="dock"]')).toBeHidden();

    await scrollToTheEndOfALongPage(page);
    await expect(tabbar).toBeInViewport();
    const box = await tabbar.boundingBox();
    expectWithinAPixel(box ? box.y + box.height : undefined, 844 - 12);
  });

  await test.step("under 768px, a bottom tab bar replaces the sidebar or topnav", async () => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/preferencias");
    await page.getByRole("combobox", { name: "Layout" }).click();
    await page.getByRole("option", { name: /Menu no topo/ }).click();
    await expect(page.locator('nav.app-shell-nav[data-shell="topnav"]')).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator(".app-shell-tabbar")).toBeVisible();
    await expect(page.locator('nav.app-shell-nav[data-shell="topnav"]')).toBeHidden();

    await scrollToTheEndOfALongPage(page);
    const tabbar = page.locator(".app-shell-tabbar");
    await expect(tabbar).toBeInViewport();
    const box = await tabbar.boundingBox();
    expectWithinAPixel(box ? box.y + box.height : undefined, 844);
  });
});
