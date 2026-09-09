import { expect, test } from "@playwright/test";

import { signUpVerifyAndSignIn, uniqueEmail } from "./support/auth";

const PASSWORD = "correct-horse-battery-staple";

test("sidebar renders open, collapses with a persisted state, and gives way to a bottom tab bar on mobile", async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("baseURL is not configured for this Playwright project");
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  await signUpVerifyAndSignIn(page, request, baseURL, {
    name: "Shell Sidebar",
    email: uniqueEmail("shell-sidebar"),
    password: PASSWORD,
  });

  const sidebar = page.locator('nav.app-shell-nav[data-shell="sidebar"]');

  await test.step("renders open by default", async () => {
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveAttribute("data-collapsed", "false");
    await expect(page.getByRole("link", { name: "Transações" })).toBeVisible();
    await expect(page.locator(".app-shell-tabbar")).toBeHidden();
  });

  await test.step("collapses and the collapsed state survives a reload", async () => {
    await page.getByRole("button", { name: "Recolher menu" }).click();
    await expect(sidebar).toHaveAttribute("data-collapsed", "true");

    await page.reload();
    await expect(page.locator('nav.app-shell-nav[data-shell="sidebar"]')).toHaveAttribute(
      "data-collapsed",
      "true",
    );
  });

  await test.step("under 768px, a bottom tab bar replaces the sidebar", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator(".app-shell-tabbar")).toBeVisible();
    await expect(page.locator('nav.app-shell-nav[data-shell="sidebar"]')).toBeHidden();
  });
});

test("switching to the sala theme renders a topnav instead of a sidebar", async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("baseURL is not configured for this Playwright project");
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  await signUpVerifyAndSignIn(page, request, baseURL, {
    name: "Theme Switcher",
    email: uniqueEmail("theme-switcher"),
    password: PASSWORD,
  });

  await page.goto("/preferencias");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "Sala" }).click();

  await expect(page.locator("html")).toHaveAttribute("data-theme", "sala");
  await expect(page.locator('nav.app-shell-nav[data-shell="topnav"]')).toBeVisible();
  await expect(page.locator('nav.app-shell-nav[data-shell="sidebar"]')).toHaveCount(0);
});
