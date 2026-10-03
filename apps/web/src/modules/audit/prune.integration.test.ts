import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { householdScope } from "@/modules/households";
import { withTwoUsers } from "@/modules/sync/test/with-two-users";

import { runDailyPruneStep } from "./prune";
import { createFinancialDataAccessRepository } from "./repository";
import { financialDataAccess } from "./schema";

const NOW = new Date("2026-10-01T00:00:00.000Z");
// retentionCutoff(NOW) is 2025-10-01: strictly before it is pruned, on or
// after it survives.
const THIRTEEN_MONTHS_AGO = new Date("2025-09-01T00:00:00.000Z");
const ONE_MONTH_AGO = new Date("2026-09-05T00:00:00.000Z");

describe("runDailyPruneStep (integration)", () => {
  it("deletes entries older than 12 months and keeps the rest", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scope = householdScope(userA.session);
      const repository = createFinancialDataAccessRepository(scope);
      await repository.record(db, userA.id, "overview");
      await repository.record(db, userA.id, "reserve");

      const rows = await db
        .select({ id: financialDataAccess.id, kind: financialDataAccess.kind })
        .from(financialDataAccess);
      const oldRow = rows.find((row) => row.kind === "overview");
      const recentRow = rows.find((row) => row.kind === "reserve");
      if (!oldRow || !recentRow) throw new Error("test setup: rows were not created");

      await db
        .update(financialDataAccess)
        .set({ accessedAt: THIRTEEN_MONTHS_AGO })
        .where(eq(financialDataAccess.id, oldRow.id));
      await db
        .update(financialDataAccess)
        .set({ accessedAt: ONE_MONTH_AGO })
        .where(eq(financialDataAccess.id, recentRow.id));

      const result = await runDailyPruneStep(db, NOW);

      expect(result).toEqual({ deleted: 1 });
      const remaining = await db.select({ id: financialDataAccess.id }).from(financialDataAccess);
      expect(remaining.map((row) => row.id)).toEqual([recentRow.id]);
    });
  });

  it("keeps a row exactly at the 12-month cutoff, deleting only strictly older ones", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scope = householdScope(userA.session);
      const repository = createFinancialDataAccessRepository(scope);
      await repository.record(db, userA.id, "overview");

      const [row] = await db.select({ id: financialDataAccess.id }).from(financialDataAccess);
      if (!row) throw new Error("test setup: row was not created");

      await db
        .update(financialDataAccess)
        .set({ accessedAt: new Date("2025-10-01T00:00:00.000Z") })
        .where(eq(financialDataAccess.id, row.id));

      const result = await runDailyPruneStep(db, NOW);

      expect(result).toEqual({ deleted: 0 });
      const remaining = await db.select({ id: financialDataAccess.id }).from(financialDataAccess);
      expect(remaining).toHaveLength(1);
    });
  });
});
