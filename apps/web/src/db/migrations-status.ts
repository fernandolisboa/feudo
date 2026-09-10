import { sql } from "drizzle-orm";

import journal from "../../drizzle/meta/_journal.json";

import type { Database } from "./client.ts";

export type MigrationsStatus = "up-to-date" | "behind" | "ahead" | "unknown";

interface JournalEntry {
  when: number;
}

const journalEntries = journal.entries as JournalEntry[];
const expectedWhen = journalEntries.map((entry) => entry.when);

export function getExpectedMigrations(): number[] {
  return expectedWhen;
}

function toMultiset(values: number[]): Map<number, number> {
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
  appliedCreatedAt: number[],
  expected: number[] = expectedWhen,
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
    console.error(error instanceof Error ? error.name : "UnknownError");
    return unknownMigrationsStatus();
  }
}
