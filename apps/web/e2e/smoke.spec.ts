import { expect, test } from "@playwright/test";

test("home page loads and shows the app title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Feudo/);
});

test("terms of use and privacy policy are public and link to each other", async ({ page }) => {
  await page.goto("/termos");
  await expect(page.getByRole("heading", { level: 1, name: "Termos de uso" })).toBeVisible();
  await page.getByRole("link", { name: "Ler a política de privacidade" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Política de privacidade" }),
  ).toBeVisible();
  await expect(page.getByText("Anthropic (Estados Unidos)", { exact: false })).toBeVisible();
});

test("the sign-up form links to both documents", async ({ page }) => {
  await page.goto("/registrar");
  await expect(page.getByRole("link", { name: "termos de uso" })).toHaveAttribute(
    "href",
    "/termos",
  );
  await expect(page.getByRole("link", { name: "política de privacidade" })).toHaveAttribute(
    "href",
    "/privacidade",
  );
});
