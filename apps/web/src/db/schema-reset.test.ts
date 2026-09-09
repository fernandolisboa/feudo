import { describe, expect, it, vi } from "vitest";

import { DatabaseResetNotAllowedError } from "./errors";
import { resetSchemas } from "./schema-reset";

import type { Database } from "./client";

function fakeDb(): { db: Database; execute: ReturnType<typeof vi.fn> } {
  const execute = vi.fn().mockResolvedValue({ rows: [] });
  return { db: { execute } as unknown as Database, execute };
}

function statementOf(execute: ReturnType<typeof vi.fn>, callIndex: number): string {
  const call = execute.mock.calls[callIndex]?.[0] as {
    queryChunks: Array<{ value: string[] }>;
  };
  return call.queryChunks[0]?.value[0] ?? "";
}

describe("resetSchemas", () => {
  it("refuses without touching the database when the guard rejects", async () => {
    const { db, execute } = fakeDb();

    await expect(resetSchemas(db, {})).rejects.toThrow(DatabaseResetNotAllowedError);
    expect(execute).not.toHaveBeenCalled();
  });

  it("refuses when VERCEL_ENV is production even if opted in", async () => {
    const { db, execute } = fakeDb();

    await expect(
      resetSchemas(db, { DATABASE_RESET_ALLOWED: "preview", VERCEL_ENV: "production" }),
    ).rejects.toThrow(DatabaseResetNotAllowedError);
    expect(execute).not.toHaveBeenCalled();
  });

  it("drops the drizzle migrations schema and the public schema, then recreates public", async () => {
    const { db, execute } = fakeDb();

    await resetSchemas(db, { DATABASE_RESET_ALLOWED: "preview" });

    expect(execute).toHaveBeenCalledTimes(3);
    expect(statementOf(execute, 0)).toBe('drop schema if exists "drizzle" cascade');
    expect(statementOf(execute, 1)).toBe('drop schema if exists "public" cascade');
    expect(statementOf(execute, 2)).toBe('create schema "public"');
  });
});
