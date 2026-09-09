import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const DUMMY_DATABASE_URL = "postgres://user:pass@localhost:5432/db";

describe("getDb", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.resetModules();
    process.env.DATABASE_URL = DUMMY_DATABASE_URL;
  });

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it("wires the pool error logger onto the underlying client", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { getDb } = await import("./client.ts");
    getDb();

    let emitted: boolean | undefined;
    expect(() => {
      emitted = getDb().$client.emit("error", new Error("x"));
    }).not.toThrow();

    expect(emitted).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith("Neon Pool error", { name: "Error", code: undefined });

    errorSpy.mockRestore();
  });
});
