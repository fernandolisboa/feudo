import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { withTestDb } from "@/db/test/harness";

import { resetHealthProbeCache } from "./probe";
import { GET } from "./route";

interface MigrationRow {
  id: number;
  hash: string;
  created_at: string;
  [key: string]: unknown;
}

interface HealthBody {
  ok: boolean;
  db: boolean;
  migrations: { status: "up-to-date" | "behind" | "ahead" | "unknown" };
}

describe("GET /api/health (integration)", () => {
  it("reports migrations up to date once the preview project is fully migrated", async () => {
    await withTestDb(async () => {
      resetHealthProbeCache();

      const response = await GET();
      const body = (await response.json()) as HealthBody;

      expect(response.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.migrations.status).toBe("up-to-date");
    });
  });

  it("reports migrations behind and returns 503 when the latest migration row is missing", async () => {
    await withTestDb(async (db) => {
      const { rows } = await db.execute<MigrationRow>(
        sql`select id, hash, created_at from drizzle.__drizzle_migrations order by created_at desc limit 1`,
      );
      const lastRow = rows[0];
      expect(lastRow).toBeDefined();
      if (!lastRow) {
        throw new Error("drizzle.__drizzle_migrations is unexpectedly empty");
      }

      const deleted = await db.execute(
        sql`delete from drizzle.__drizzle_migrations where id = ${lastRow.id}`,
      );

      try {
        resetHealthProbeCache();

        const response = await GET();
        const body = (await response.json()) as HealthBody;

        expect(response.status).toBe(503);
        expect(body.ok).toBe(false);
        expect(body.db).toBe(true);
        expect(body.migrations.status).toBe("behind");
      } finally {
        if (deleted.rowCount) {
          await db.execute(
            sql`insert into drizzle.__drizzle_migrations (id, hash, created_at)
                values (${lastRow.id}, ${lastRow.hash}, ${lastRow.created_at})
                on conflict (id) do nothing`,
          );
        }
        resetHealthProbeCache();
      }
    });
  });
});
