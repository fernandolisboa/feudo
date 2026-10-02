import { and, asc, count, desc, eq, gte, isNotNull, lt } from "drizzle-orm";

import type { AnalysisInput, AnalysisOutput } from "@feudo/core";

import { organization } from "@/modules/auth/schema";
import type { HouseholdScope } from "@/modules/households";
import { bankAccount } from "@/modules/sync/schema";

import type { Database, DatabaseOrTransaction } from "@/platform/db/client";
import { householdAnalysis } from "./schema";

export type AnalysisKind = (typeof householdAnalysis.kind.enumValues)[number];

export type NewAnalysis = {
  period: string;
  localDay: string;
  promptVersion: string;
  requestedModel: string;
  input: AnalysisInput;
  requestedByUserId: string | null;
};

export type AnalysisCompletion = {
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
};

export type StoredAnalysis = {
  id: string;
  kind: AnalysisKind;
  period: string;
  promptVersion: string;
  model: string | null;
  input: unknown;
  output: unknown;
  completedAt: Date | null;
};

export class AnalysisRepositoryInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisRepositoryInvariantError";
  }
}

export type OnDemandReservation =
  { status: "reserved"; id: string; used: number } | { status: "quota_exhausted" | "in_progress" };

// Every method is bound to the household taken from the session or from the
// job's own enumeration (ADR-0001): none accepts a household id.
export function createAnalysisRepository(scope: HouseholdScope) {
  const inHousehold = eq(householdAnalysis.householdId, scope.householdId);

  async function countOnDemandOn(db: DatabaseOrTransaction, localDay: string): Promise<number> {
    const [row] = await db
      .select({ total: count() })
      .from(householdAnalysis)
      .where(
        and(
          inHousehold,
          eq(householdAnalysis.kind, "on_demand"),
          eq(householdAnalysis.localDay, localDay),
        ),
      );
    return row?.total ?? 0;
  }

  async function hasRunningSince(db: DatabaseOrTransaction, since: Date): Promise<boolean> {
    const rows = await db
      .select({ id: householdAnalysis.id })
      .from(householdAnalysis)
      .where(
        and(
          inHousehold,
          eq(householdAnalysis.status, "running"),
          gte(householdAnalysis.createdAt, since),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  // A reading still "running" past `staleBefore` belongs to a function that
  // died mid-call; it must not block the household forever.
  async function abandonStale(db: DatabaseOrTransaction, staleBefore: Date): Promise<void> {
    await db
      .update(householdAnalysis)
      .set({ status: "failed", failureReason: "abandoned", completedAt: new Date() })
      .where(
        and(
          inHousehold,
          eq(householdAnalysis.status, "running"),
          lt(householdAnalysis.createdAt, staleBefore),
        ),
      );
  }

  async function insert(
    db: DatabaseOrTransaction,
    kind: AnalysisKind,
    row: NewAnalysis,
  ): Promise<string> {
    const [inserted] = await db
      .insert(householdAnalysis)
      .values({ householdId: scope.householdId, kind, ...row })
      .returning({ id: householdAnalysis.id });
    if (!inserted) {
      throw new AnalysisRepositoryInvariantError("household_analysis insert returned no row");
    }
    return inserted.id;
  }

  return {
    countOnDemandOn,
    hasRunningSince,

    async latestSucceeded(db: Database): Promise<StoredAnalysis | null> {
      const [row] = await db
        .select({
          id: householdAnalysis.id,
          kind: householdAnalysis.kind,
          period: householdAnalysis.period,
          promptVersion: householdAnalysis.promptVersion,
          model: householdAnalysis.model,
          input: householdAnalysis.input,
          output: householdAnalysis.output,
          completedAt: householdAnalysis.completedAt,
        })
        .from(householdAnalysis)
        .where(
          and(
            inHousehold,
            eq(householdAnalysis.status, "succeeded"),
            isNotNull(householdAnalysis.output),
          ),
        )
        .orderBy(desc(householdAnalysis.completedAt))
        .limit(1);
      return row ?? null;
    },

    // Counting and inserting under a lock on the household's own row, the
    // way the manual sync quota does, so two members pressing the button
    // together cannot both read "two used" and both start a third, nor start
    // two readings at once.
    async reserveOnDemand(
      db: Database,
      input: { row: NewAnalysis; limit: number; staleBefore: Date },
    ): Promise<OnDemandReservation> {
      return db.transaction(async (tx) => {
        await tx
          .select({ id: organization.id })
          .from(organization)
          .where(eq(organization.id, scope.householdId))
          .for("no key update");
        await abandonStale(tx, input.staleBefore);
        if (await hasRunningSince(tx, input.staleBefore)) {
          return { status: "in_progress" };
        }
        const used = await countOnDemandOn(tx, input.row.localDay);
        if (used >= input.limit) {
          return { status: "quota_exhausted" };
        }
        const id = await insert(tx, "on_demand", input.row);
        return { status: "reserved", id, used: used + 1 };
      });
    },

    // Returns null when this period already has a monthly reading running or
    // done, or has failed `maxFailures` times; the partial unique index
    // (schema.ts) is the real guard against two concurrent runs.
    async startMonthly(
      db: Database,
      input: { row: NewAnalysis; maxFailures: number; staleBefore: Date },
    ): Promise<string | null> {
      return db.transaction(async (tx) => {
        await abandonStale(tx, input.staleBefore);
        const [failures] = await tx
          .select({ total: count() })
          .from(householdAnalysis)
          .where(
            and(
              inHousehold,
              eq(householdAnalysis.kind, "monthly"),
              eq(householdAnalysis.period, input.row.period),
              eq(householdAnalysis.status, "failed"),
            ),
          );
        if ((failures?.total ?? 0) >= input.maxFailures) {
          return null;
        }
        const [inserted] = await tx
          .insert(householdAnalysis)
          .values({ householdId: scope.householdId, kind: "monthly", ...input.row })
          .onConflictDoNothing()
          .returning({ id: householdAnalysis.id });
        return inserted?.id ?? null;
      });
    },

    async succeed(
      db: Database,
      id: string,
      result: AnalysisCompletion & { output: AnalysisOutput },
    ): Promise<void> {
      await db
        .update(householdAnalysis)
        .set({ status: "succeeded", completedAt: new Date(), ...result })
        .where(and(inHousehold, eq(householdAnalysis.id, id)));
    },

    async fail(
      db: Database,
      id: string,
      result: AnalysisCompletion & { failureReason: string },
    ): Promise<void> {
      await db
        .update(householdAnalysis)
        .set({ status: "failed", completedAt: new Date(), ...result })
        .where(and(inHousehold, eq(householdAnalysis.id, id)));
    },
  };
}

// Job-only enumeration (ADR-0001, amended 2026-10-01): the monthly cron is
// the one caller that walks every household, and only those with at least
// one bank account have anything to read.
export async function listHouseholdsWithAccounts(db: Database): Promise<HouseholdScope[]> {
  const rows = await db
    .selectDistinct({ householdId: bankAccount.householdId })
    .from(bankAccount)
    .where(isNotNull(bankAccount.householdId))
    .orderBy(asc(bankAccount.householdId));
  return rows.flatMap((row) =>
    row.householdId === null ? [] : [{ householdId: row.householdId }],
  );
}
