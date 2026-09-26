import { sql } from "drizzle-orm";

import journal from "../../../drizzle/meta/_journal.json";
import { findSqlState } from "./sql-state.ts";

import type { Database } from "./client.ts";

export type MigrationsStatus = "up-to-date" | "behind" | "ahead" | "unknown";

interface JournalEntry {
  when: number;
}

const journalEntries = journal.entries as JournalEntry[];
const expectedWhen = journalEntries.map((entry) => entry.when);

export function getExpectedMigrations(): readonly number[] {
  return expectedWhen;
}

function toMultiset(values: readonly number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function hasSurplus(left: Map<number, number>, right: Map<number, number>): boolean {
  for (const [value, count] of left) {
    if (count > (right.get(value) ?? 0)) {
      return true;
    }
  }
  return false;
}

export function evaluateMigrationsStatus(
  appliedCreatedAt: readonly number[],
  expected: readonly number[] = expectedWhen,
): MigrationsStatus {
  const appliedCounts = toMultiset(appliedCreatedAt);
  const expectedCounts = toMultiset(expected);

  if (hasSurplus(appliedCounts, expectedCounts)) {
    return "ahead";
  }
  if (hasSurplus(expectedCounts, appliedCounts)) {
    return "behind";
  }
  return "up-to-date";
}

export function unknownMigrationsStatus(): MigrationsStatus {
  return "unknown";
}

interface MigrationRow {
  created_at: string;
  [key: string]: unknown;
}

const RELATION_DOES_NOT_EXIST = "42P01";
const MAX_CAUSE_CHAIN_DEPTH = 5;

function hasCause(value: unknown): value is { cause: unknown } {
  return typeof value === "object" && value !== null && "cause" in value;
}

function innermostErrorName(error: unknown): string {
  let name = "UnknownError";
  let current = error;
  for (let depth = 0; depth < MAX_CAUSE_CHAIN_DEPTH; depth += 1) {
    if (current instanceof Error) {
      name = current.name;
    }
    if (!hasCause(current)) {
      return name;
    }
    current = current.cause;
  }
  return name;
}

export async function getMigrationsStatus(db: Database): Promise<MigrationsStatus> {
  try {
    const { rows } = await db.execute<MigrationRow>(
      sql`select created_at from drizzle.__drizzle_migrations`,
    );
    const appliedCreatedAt = rows.map((row) => Number(row.created_at));
    const status = evaluateMigrationsStatus(appliedCreatedAt);
    console.log(
      `migrations status=${status} applied=${String(appliedCreatedAt.length)} expected=${String(expectedWhen.length)}`,
    );
    return status;
  } catch (error) {
    console.error(innermostErrorName(error));
    if (findSqlState(error) === RELATION_DOES_NOT_EXIST) {
      return "behind";
    }
    return unknownMigrationsStatus();
  }
}
