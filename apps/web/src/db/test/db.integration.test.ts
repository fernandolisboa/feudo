import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { withTestDb } from "./harness";

describe("database connection", () => {
  it("runs a query against the shared preview branch", async () => {
    await withTestDb(async (db) => {
      const { rows } = await db.execute<{ answer: number }>(sql`select 1 as answer`);
      expect(rows).toEqual([{ answer: 1 }]);
    });
  });
});
