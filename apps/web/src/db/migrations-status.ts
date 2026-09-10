import { sql } from "drizzle-orm";

import journal from "../../drizzle/meta/_journal.json";

import type { Database } from "./client.ts";

export interface MigrationsStatus {
  applied: number;
  expected: number;
  upToDate: boolean;
}

export interface AppliedMigrations {
  count: number;
  latestCreatedAt: number | null;
}

export interface ExpectedMigrations {
  count: number;
  latestWhen: number | null;
}

interface JournalEntry {
  when: number;
}

const journalEntries = journal.entries as JournalEntry[];

export function getExpectedMigrations(): ExpectedMigrations {
  const lastEntry = journalEntries.at(-1);
  return { count: journalEntries.length, latestWhen: lastEntry?.when ?? null };
}

export function evaluateMigrationsStatus(
  applied: AppliedMigrations,
  expected: ExpectedMigrations,
): MigrationsStatus {
  const upToDate =
    applied.count === expected.count && applied.latestCreatedAt === expected.latestWhen;

  return { applied: applied.count, expected: expected.count, upToDate };
}

interface MigrationsCountRow {
  count: number;
  latestCreatedAt: string | null;
  [key: string]: unknown;
}

export async function getMigrationsStatus(db: Database): Promise<MigrationsStatus> {
  const expected = getExpectedMigrations();

  try {
    const { rows } = await db.execute<MigrationsCountRow>(
      sql`select count(*)::int as count, max(created_at) as "latestCreatedAt" from drizzle.__drizzle_migrations`,
    );
    const row = rows[0];
    const applied: AppliedMigrations = {
      count: row?.count ?? 0,
      latestCreatedAt: row?.latestCreatedAt != null ? Number(row.latestCreatedAt) : null,
    };
    return evaluateMigrationsStatus(applied, expected);
  } catch {
    return { applied: 0, expected: expected.count, upToDate: false };
  }
}
