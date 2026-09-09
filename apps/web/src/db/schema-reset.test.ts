import { describe, expect, it, vi } from "vitest";

import { DatabaseResetNotAllowedError } from "./errors";
import { resetSchemas } from "./schema-reset";

import type { Database } from "./client";

const PREVIEW_URL =
  "postgres://user:pass@ep-late-flower-awib0vvd-pooler.c-12.us-east-1.aws.neon.tech/db";
const PREVIEW_HOST = "ep-late-flower-awib0vvd-pooler.c-12.us-east-1.aws.neon.tech";

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
      resetSchemas(db, {
        DATABASE_URL: PREVIEW_URL,
        DATABASE_RESET_ALLOWED_HOST: PREVIEW_HOST,
        VERCEL_ENV: "production",
      }),
    ).rejects.toThrow(DatabaseResetNotAllowedError);
    expect(execute).not.toHaveBeenCalled();
  });

  it("drops the drizzle migrations schema and the public schema, then recreates public", async () => {
    const { db, execute } = fakeDb();

    await resetSchemas(db, {
      DATABASE_URL: PREVIEW_URL,
      DATABASE_RESET_ALLOWED_HOST: PREVIEW_HOST,
    });

    expect(execute).toHaveBeenCalledTimes(4);
    expect(statementOf(execute, 0)).toBe('drop schema if exists "drizzle" cascade');
    expect(statementOf(execute, 1)).toBe('drop schema if exists "public" cascade');
    expect(statementOf(execute, 2)).toBe('create schema "public"');
    expect(statementOf(execute, 3)).toBe("grant usage, create on schema public to public");
  });
});
