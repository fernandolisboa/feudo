import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const testOnlyToken = process.env.TEST_ONLY_TOKEN;

const extraHTTPHeaders: Record<string, string> = {};
if (bypassSecret) {
  extraHTTPHeaders["x-vercel-protection-bypass"] = bypassSecret;
  extraHTTPHeaders["x-vercel-set-bypass-cookie"] = "true";
}
if (testOnlyToken) {
  extraHTTPHeaders.authorization = `Bearer ${testOnlyToken}`;
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  timeout: 60_000,
  use: {
    baseURL,
    extraHTTPHeaders,
  },
});
