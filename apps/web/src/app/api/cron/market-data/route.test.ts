import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET } from "./route";

const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET;

describe("GET /api/cron/market-data", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
  });

  it("returns 401 when no bearer token is provided", async () => {
    const response = await GET(new Request("https://example.com/api/cron/market-data"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ ok: false });
  });

  it("returns 401 when the bearer token does not match", async () => {
    const response = await GET(
      new Request("https://example.com/api/cron/market-data", {
        headers: { authorization: "Bearer wrong-secret" },
      }),
    );

    expect(response.status).toBe(401);
  });
});
