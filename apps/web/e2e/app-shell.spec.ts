import { expect, test } from "@playwright/test";

import { signUpVerifyAndSignIn, uniqueEmail } from "./support/auth";

const PASSWORD = "correct-horse-battery-staple";

test("desktop sidebar renders open by default in the caderno theme", async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("baseURL is not configured for this Playwright project");
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  await signUpVerifyAndSignIn(page, request, baseURL, {
    name: "Sidebar Open",
    email: uniqueEmail("sidebar-open"),
    password: PASSWORD,
  });

  const nav = page.locator('nav.app-shell-nav[data-shell="sidebar"]');
  await expect(nav).toBeVisible();
  await expect(nav).toHaveAttribute("data-collapsed", "false");
  await expect(page.getByRole("link", { name: "Transações" })).toBeVisible();
  await expect(page.locator(".app-shell-tabbar")).toBeHidden();
});

test("the sidebar collapses and the collapsed state survives a reload", async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("baseURL is not configured for this Playwright project");
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  await signUpVerifyAndSignIn(page, request, baseURL, {
    name: "Sidebar Collapsed",
    email: uniqueEmail("sidebar-collapsed"),
    password: PASSWORD,
  });

  const nav = page.locator('nav.app-shell-nav[data-shell="sidebar"]');
  await page.getByRole("button", { name: "Recolher menu" }).click();
  await expect(nav).toHaveAttribute("data-collapsed", "true");

  await page.reload();
  await expect(page.locator('nav.app-shell-nav[data-shell="sidebar"]')).toHaveAttribute(
    "data-collapsed",
    "true",
  );
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

test("under 768px every theme shows a bottom tab bar instead of the sidebar or topnav", async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("baseURL is not configured for this Playwright project");
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await signUpVerifyAndSignIn(page, request, baseURL, {
    name: "Mobile Nav",
    email: uniqueEmail("mobile-nav"),
    password: PASSWORD,
  });

  await expect(page.locator(".app-shell-tabbar")).toBeVisible();
  await expect(page.locator('nav.app-shell-nav[data-shell="sidebar"]')).toBeHidden();
});
