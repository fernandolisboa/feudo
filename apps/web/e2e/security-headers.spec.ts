import { expect, test, type APIResponse } from "@playwright/test";

function expectStaticHeaders(response: APIResponse): void {
  const headers = response.headers();
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["x-powered-by"]).toBeUndefined();
}

test("a page carries the security headers and a per-request CSP nonce its scripts use", async ({
  request,
}) => {
  const first = await request.get("/entrar");
  const second = await request.get("/entrar");
  expectStaticHeaders(first);

  const policy = first.headers()["content-security-policy"] ?? "";
  expect(policy).toContain("frame-ancestors 'none'");
  expect(policy).toContain("object-src 'none'");
  expect(policy).toContain("base-uri 'self'");
  const nonce = /'nonce-([^']+)'/.exec(policy)?.[1];
  expect(nonce).toBeDefined();
  expect(second.headers()["content-security-policy"]).not.toContain(`'nonce-${nonce ?? ""}'`);

  const html = await first.text();
  const scriptTags = html.match(/<script\b[^>]*>/g) ?? [];
  expect(scriptTags.length).toBeGreaterThan(0);
  for (const tag of scriptTags) {
    expect(tag).toContain(`nonce="${nonce ?? ""}"`);
  }
});

test("an API route carries the security headers", async ({ request }) => {
  expectStaticHeaders(await request.get("/api/health"));
});

// Vercel injects its preview toolbar (vercel.live) into preview deployments
// only; it is not part of the app and production never loads it.
const VERCEL_PREVIEW_TOOLBAR = "vercel.live";

test("the sign-in page loads every script with no CSP violation", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    if (text.includes("Content Security Policy") && !text.includes(VERCEL_PREVIEW_TOOLBAR)) {
      violations.push(text);
    }
  });
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      console.error(
        `Content Security Policy violation: ${event.violatedDirective} ${event.blockedURI} ${event.sourceFile}:${String(event.lineNumber)}:${String(event.columnNumber)}`,
      );
    });
  });

  await page.goto("/entrar");
  await page.waitForLoadState("networkidle");
  await expect(page.getByLabel("E-mail")).toBeVisible();
  expect(violations).toEqual([]);
});
