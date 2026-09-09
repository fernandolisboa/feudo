import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { verification } from "@/db/schema/auth";
import { withTestDb } from "@/db/test/harness";

import { GET } from "./route";

const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET;

async function callCronRoute(): Promise<Response> {
  return GET(
    new Request("https://example.com/api/cron/prune-verification", {
      headers: { authorization: "Bearer test-secret" },
    }),
  );
}

describe("GET /api/cron/prune-verification (integration)", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
  });

  it("deletes expired verification rows and leaves unexpired ones untouched", async () => {
    await withTestDb(async (db) => {
      const expiredId = randomUUID();
      const validId = randomUUID();
      const now = new Date();

      await db.insert(verification).values([
        {
          id: expiredId,
          identifier: "reset-password:expired@example.com",
          value: "expired-user-id",
          expiresAt: new Date(now.getTime() - 60_000),
        },
        {
          id: validId,
          identifier: "reset-password:valid@example.com",
          value: "valid-user-id",
          expiresAt: new Date(now.getTime() + 60_000),
        },
      ]);

      const response = await callCronRoute();
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ ok: true, deleted: 1 });

      const remaining = await db.select().from(verification);
      expect(remaining.map((row) => row.id)).toEqual([validId]);

      const expiredRow = await db.select().from(verification).where(eq(verification.id, expiredId));
      expect(expiredRow).toHaveLength(0);
    });
  });

  it("returns 401 when the bearer token is missing, without deleting anything", async () => {
    await withTestDb(async (db) => {
      const expiredId = randomUUID();
      await db.insert(verification).values({
        id: expiredId,
        identifier: "reset-password:unauthorized@example.com",
        value: "unauthorized-user-id",
        expiresAt: new Date(Date.now() - 60_000),
      });

      const response = await GET(new Request("https://example.com/api/cron/prune-verification"));
      expect(response.status).toBe(401);

      const remaining = await db.select().from(verification);
      expect(remaining).toHaveLength(1);
    });
  });
});
