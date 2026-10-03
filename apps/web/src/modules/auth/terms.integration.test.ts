import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { withTestDb } from "@/platform/db/test/harness";

import { user } from "./schema";
import { recordCurrentTermsAcceptance, TERMS_VERSION } from "./terms";

import type { Database } from "@/platform/db/client";

const SIGNED_UP_AT = new Date("2026-09-10T12:00:00Z");

async function seedUser(db: Database, termsVersion: string): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(user).values({
    id,
    name: id,
    email: `${id}@example.com`,
    emailVerified: true,
    termsVersion,
    termsAcceptedAt: SIGNED_UP_AT,
  });
  return id;
}

async function readAcceptance(db: Database, id: string) {
  const [row] = await db
    .select({ termsVersion: user.termsVersion, termsAcceptedAt: user.termsAcceptedAt })
    .from(user)
    .where(eq(user.id, id));
  return row;
}

describe("recordCurrentTermsAcceptance (integration)", () => {
  it("records the current version and time for the session's own user only", async () => {
    await withTestDb(async (db) => {
      const accepting = await seedUser(db, "2026-09-09");
      const other = await seedUser(db, "2026-09-09");
      const now = new Date("2026-10-04T09:00:00Z");

      await recordCurrentTermsAcceptance(db, { userId: accepting }, now);

      expect(await readAcceptance(db, accepting)).toEqual({
        termsVersion: TERMS_VERSION,
        termsAcceptedAt: now,
      });
      expect(await readAcceptance(db, other)).toEqual({
        termsVersion: "2026-09-09",
        termsAcceptedAt: SIGNED_UP_AT,
      });
    });
  });

  it("keeps the original acceptance time when the current version was already accepted", async () => {
    await withTestDb(async (db) => {
      const id = await seedUser(db, TERMS_VERSION);

      await recordCurrentTermsAcceptance(db, { userId: id }, new Date("2026-10-04T09:00:00Z"));

      expect(await readAcceptance(db, id)).toEqual({
        termsVersion: TERMS_VERSION,
        termsAcceptedAt: SIGNED_UP_AT,
      });
    });
  });
});
