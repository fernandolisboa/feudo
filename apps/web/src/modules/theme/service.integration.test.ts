import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/auth", () => ({ getCurrentSession: getCurrentSessionMock }));

import type { Database } from "@/platform/db/client";
import { user } from "@/modules/auth/schema";
import { withTestDb } from "@/platform/db/test/harness";

import { updateTheme } from "./service";

beforeEach(() => {
  getCurrentSessionMock.mockReset();
});

async function insertUser(db: Database, id: string, email: string): Promise<void> {
  await db.insert(user).values({
    id,
    name: `Theme Isolation ${id}`,
    email,
    emailVerified: true,
    termsVersion: "test",
    termsAcceptedAt: new Date(),
  });
}

describe("updateTheme isolation", () => {
  it("only changes the signed-in user's own theme, never another user's", async () => {
    await withTestDb(async (db) => {
      const userAId = "theme-isolation-user-a";
      const userBId = "theme-isolation-user-b";
      await insertUser(db, userAId, "theme-isolation-a@example.com");
      await insertUser(db, userBId, "theme-isolation-b@example.com");

      getCurrentSessionMock.mockResolvedValue({
        userId: userAId,
        name: "User A",
        email: "theme-isolation-a@example.com",
        theme: "caderno",
      });
      const outcomeForA = await updateTheme({ theme: "painel" });
      expect(outcomeForA).toEqual({ status: "ok" });

      const [rowA1] = await db.select({ theme: user.theme }).from(user).where(eq(user.id, userAId));
      const [rowB1] = await db.select({ theme: user.theme }).from(user).where(eq(user.id, userBId));
      expect(rowA1?.theme).toBe("painel");
      expect(rowB1?.theme).toBe("caderno");

      getCurrentSessionMock.mockResolvedValue({
        userId: userBId,
        name: "User B",
        email: "theme-isolation-b@example.com",
        theme: "caderno",
      });
      const outcomeForB = await updateTheme({ theme: "sala" });
      expect(outcomeForB).toEqual({ status: "ok" });

      const [rowA2] = await db.select({ theme: user.theme }).from(user).where(eq(user.id, userAId));
      const [rowB2] = await db.select({ theme: user.theme }).from(user).where(eq(user.id, userBId));
      expect(rowA2?.theme).toBe("painel");
      expect(rowB2?.theme).toBe("sala");
    });
  });

  it("returns unauthenticated and writes nothing without a session", async () => {
    await withTestDb(async (db) => {
      const userId = "theme-isolation-user-c";
      await insertUser(db, userId, "theme-isolation-c@example.com");
      getCurrentSessionMock.mockResolvedValue(null);

      const outcome = await updateTheme({ theme: "painel" });
      expect(outcome).toEqual({ status: "unauthenticated" });

      const [row] = await db.select({ theme: user.theme }).from(user).where(eq(user.id, userId));
      expect(row?.theme).toBe("caderno");
    });
  });
});
