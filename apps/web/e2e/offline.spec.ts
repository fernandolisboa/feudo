import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import { lastEmailLink, signUpVerifyAndSignIn, uniqueEmail } from "./support/auth";

const OFFLINE_COPIES_CACHE = "feudo-offline-copies";

async function waitForServiceWorker(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null), {
      message: "the service worker never took control of the page",
    })
    .toBe(true);
}

async function offlineCopyPaths(page: Page): Promise<string[]> {
  return page.evaluate(async (cacheName) => {
    if (!(await caches.has(cacheName))) {
      return [];
    }
    const cache = await caches.open(cacheName);
    return (await cache.keys()).map((request) => new URL(request.url).pathname);
  }, OFFLINE_COPIES_CACHE);
}

test("offline: last copy of each screen, writes refused, nothing left after sign-out or a household switch", async ({
  page,
  context,
  request,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("baseURL is not configured for this Playwright project");
  }
  // Two accounts, an invitation and its acceptance, each sign-up able to wait
  // out Better Auth's shared rate-limit window (support/auth.ts).
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 1280, height: 900 });

  const first = {
    name: "Offline Ana",
    email: uniqueEmail("offline-a"),
    password: "correct-horse-battery-staple",
  };
  const second = {
    name: "Offline Bia",
    email: uniqueEmail("offline-b"),
    password: "correct-horse-battery-staple",
  };
  const firstHousehold = `Casa de ${first.name}`;
  await signUpVerifyAndSignIn(page, request, baseURL, first);
  await waitForServiceWorker(page);
  const sidebar = page.locator('nav.app-shell-nav[data-shell="sidebar"]');

  await test.step("each screen opened online is kept on the device", async () => {
    await expect.poll(() => offlineCopyPaths(page)).toContain("/");
    await sidebar.getByRole("link", { name: "Casa" }).click();
    await expect(page).toHaveURL(/\/casa$/);
    await expect.poll(() => offlineCopyPaths(page)).toContain("/casa");

    await page.getByRole("button", { name: "Convidar" }).click();
    await page.getByLabel("E-mail").fill(second.email);
    await page.getByRole("button", { name: "Enviar convite" }).click();
    await expect(page.getByText(second.email)).toBeVisible();
  });

  await test.step("offline, the installed app reopens the screen with its last data and when it was read", async () => {
    await context.setOffline(true);
    await page.goto("/casa");

    await expect(page.getByText(firstHousehold).first()).toBeVisible();
    await expect(
      page.getByText("Você está sem conexão. Nada pode ser alterado até a internet voltar."),
    ).toBeVisible();
    await expect(page.getByText(/Última atualização: hoje, \d{2}:\d{2}\./)).toBeVisible();
  });

  await test.step("offline, a write is refused with a message and nothing is sent", async () => {
    const actionRequests: string[] = [];
    page.on("request", (sent) => {
      if (sent.method() === "POST") {
        actionRequests.push(sent.url());
      }
    });
    await page.getByRole("button", { name: "Convidar" }).click();
    await page.getByLabel("E-mail").fill(uniqueEmail("offline-invitee"));
    await page.getByRole("button", { name: "Enviar convite" }).click();

    await expect(page.getByText("Nada foi salvo: você está sem conexão.")).toBeVisible();
    expect(actionRequests).toEqual([]);
    await page.keyboard.press("Escape");
  });

  await test.step("offline, a screen never opened on this device shows the no-connection page", async () => {
    await page.goto("/reserva");
    await expect(page.getByRole("heading", { name: "Sem conexão" })).toBeVisible();
    await expect(page.getByText(firstHousehold)).toHaveCount(0);
  });

  await test.step("signing out erases every copy", async () => {
    await context.setOffline(false);
    await page.goto("/");
    await page.getByRole("button", { name: first.name }).click();
    await page.getByRole("menuitem", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/entrar/);

    await expect.poll(() => offlineCopyPaths(page)).toEqual([]);
  });

  await test.step("the next person on this browser never sees the previous household offline", async () => {
    await signUpVerifyAndSignIn(page, request, baseURL, second);
    await expect(page.getByText(firstHousehold)).toHaveCount(0);
    await expect.poll(() => offlineCopyPaths(page)).toContain("/");

    await context.setOffline(true);
    await page.goto("/casa");
    await expect(page.getByRole("heading", { name: "Sem conexão" })).toBeVisible();
    await expect(page.getByText(firstHousehold)).toHaveCount(0);
    await context.setOffline(false);
  });

  await test.step("switching household erases the copies of the household left behind", async () => {
    await page.goto(await lastEmailLink(request, baseURL, second.email));
    await page.getByRole("button", { name: "Aceitar e entrar" }).click();
    await expect(page).toHaveURL(/\/$/);

    await sidebar.getByRole("link", { name: "Casa" }).click();
    await expect(page).toHaveURL(/\/casa$/);
    await expect(page.getByText(firstHousehold).first()).toBeVisible();
    await expect.poll(() => offlineCopyPaths(page)).toContain("/casa");

    await sidebar.getByLabel("Casa").click();
    await page.getByRole("option", { name: `Casa de ${second.name}` }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => offlineCopyPaths(page)).not.toContain("/casa");

    await context.setOffline(true);
    await page.goto("/casa");
    await expect(page.getByRole("heading", { name: "Sem conexão" })).toBeVisible();
    await expect(page.getByText(firstHousehold)).toHaveCount(0);
    await context.setOffline(false);
  });
});
