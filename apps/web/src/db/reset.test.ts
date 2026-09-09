import { describe, expect, it, vi } from "vitest";

import { DatabaseResetNotAllowedError } from "./errors";
import { resetDatabase } from "./reset";

import type { Database } from "./client";

function fakeDb(rows: Array<{ tablename: string }>): {
  db: Database;
  execute: ReturnType<typeof vi.fn>;
} {
  const execute = vi.fn().mockResolvedValueOnce({ rows }).mockResolvedValue({ rows: [] });
  return { db: { execute } as unknown as Database, execute };
}

describe("resetDatabase", () => {
  it("refuses without querying the database when the guard rejects", async () => {
    const { db, execute } = fakeDb([{ tablename: "household" }]);

    await expect(resetDatabase(db, {})).rejects.toThrow(DatabaseResetNotAllowedError);
    expect(execute).not.toHaveBeenCalled();
  });

  it("truncates every table in the public schema with safely quoted identifiers", async () => {
    const { db, execute } = fakeDb([{ tablename: "household" }, { tablename: 'weird"name' }]);

    const count = await resetDatabase(db, { DATABASE_RESET_ALLOWED: "preview" });

    expect(count).toBe(2);
    expect(execute).toHaveBeenCalledTimes(2);
    const truncateCall = execute.mock.calls[1]?.[0] as {
      queryChunks: Array<{ value: string[] }>;
    };
    const truncateSql = truncateCall.queryChunks[0]?.value[0] ?? "";
    expect(truncateSql).toContain('"household"');
    expect(truncateSql).toContain('"weird""name"');
  });

  it("does nothing when there are no tables", async () => {
    const { db, execute } = fakeDb([]);

    const count = await resetDatabase(db, { DATABASE_RESET_ALLOWED: "preview" });

    expect(count).toBe(0);
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
