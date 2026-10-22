import { beforeEach, describe, expect, it } from "vitest";
import { count, eq } from "drizzle-orm";

import type { Database } from "@/platform/db/client";
import { withTestDb } from "@/platform/db/test/harness";

import { EMAIL_QUOTA_LIMITS, reserveEmailQuota } from "./email-quota";
import { fakeSentEmails, user } from "./schema";
import { requestMagicLink, requestPasswordReset, resendVerification, signUp } from "./service";
import { signUpVerifiedUser } from "./test/sign-up-verified-user";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

beforeEach(() => {
  process.env.REGISTRATION_MODE = "open";
});

const POLL_TIMEOUT_MS = 5000;
const POLL_INTERVAL_MS = 25;
// Past the window sign-up's own verification email opened.
const TWO_HOURS_MS = 2 * 60 * 60_000;

async function pollUntil(read: () => Promise<number>, expected: number): Promise<void> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  for (;;) {
    const value = await read();
    if (value >= expected) {
      return;
    }
    if (Date.now() >= deadline) {
      throw new Error(`timed out waiting for ${String(expected)}, last saw ${String(value)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

async function sentEmailCount(db: Database, to: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(fakeSentEmails)
    .where(eq(fakeSentEmails.to, to));
  return row?.total ?? 0;
}

async function authEmailCount(db: Database, email: string): Promise<number> {
  const [row] = await db
    .select({ total: user.authEmailCount })
    .from(user)
    .where(eq(user.email, email));
  return row?.total ?? 0;
}

async function userIdFor(db: Database, email: string): Promise<string> {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  if (!row) throw new Error("user missing in test setup");
  return row.id;
}

function fromIp(ip: string): Headers {
  return new Headers({ "x-forwarded-for": ip });
}

describe("per-recipient auth email quota (integration)", () => {
  it("stops sending auth emails to one address after the hourly limit, from any IP, while answering as if it sent", async () => {
    await withTestDb(async (db) => {
      const email = "quota-target@example.com";
      await signUpVerifiedUser(db, { name: "Target", email, password: "correct-horse" });
      expect(await sentEmailCount(db, email)).toBe(1);

      for (let index = 1; index < EMAIL_QUOTA_LIMITS.auth; index += 1) {
        const outcome = await requestMagicLink(email, fromIp(`10.0.0.${String(index)}`));
        expect(outcome).toEqual({ status: "ok" });
      }
      await pollUntil(() => sentEmailCount(db, email), EMAIL_QUOTA_LIMITS.auth);

      const overMagicLink = await requestMagicLink(email, fromIp("10.0.1.1"));
      const overReset = await requestPasswordReset(email, fromIp("10.0.1.2"));
      expect(overMagicLink).toEqual({ status: "ok" });
      expect(overReset).toEqual({ status: "ok" });

      await pollUntil(() => authEmailCount(db, email), EMAIL_QUOTA_LIMITS.auth + 2);
      expect(await sentEmailCount(db, email)).toBe(EMAIL_QUOTA_LIMITS.auth);
    });
  });

  it("counts verification resends toward the same quota", async () => {
    await withTestDb(async (db) => {
      const email = "quota-unverified@example.com";
      await signUp(
        { name: "Unverified", email, password: "correct-horse", termsAccepted: true },
        fromIp("10.0.2.1"),
      );
      for (let index = 1; index < EMAIL_QUOTA_LIMITS.auth; index += 1) {
        await resendVerification(email, fromIp(`10.0.2.${String(index + 1)}`));
      }
      expect(await sentEmailCount(db, email)).toBe(EMAIL_QUOTA_LIMITS.auth);

      const over = await resendVerification(email, fromIp("10.0.3.1"));
      expect(over).toEqual({ status: "ok" });
      expect(await authEmailCount(db, email)).toBe(EMAIL_QUOTA_LIMITS.auth + 1);
      expect(await sentEmailCount(db, email)).toBe(EMAIL_QUOTA_LIMITS.auth);
    });
  });

  it("keeps one user's quota separate from another's", async () => {
    await withTestDb(async (db) => {
      await signUpVerifiedUser(db, {
        name: "A",
        email: "quota-a@example.com",
        password: "correct-horse",
      });
      await signUpVerifiedUser(db, {
        name: "B",
        email: "quota-b@example.com",
        password: "correct-horse",
      });
      const userA = await userIdFor(db, "quota-a@example.com");
      const userB = await userIdFor(db, "quota-b@example.com");

      for (let index = 1; index < EMAIL_QUOTA_LIMITS.auth; index += 1) {
        expect(await reserveEmailQuota(db, userA, "auth")).toBe(true);
      }
      expect(await reserveEmailQuota(db, userA, "auth")).toBe(false);
      expect(await reserveEmailQuota(db, userB, "auth")).toBe(true);
    });
  });

  it("opens a fresh window an hour after the first send of the last one", async () => {
    await withTestDb(async (db) => {
      await signUpVerifiedUser(db, {
        name: "Window",
        email: "quota-window@example.com",
        password: "correct-horse",
      });
      const userId = await userIdFor(db, "quota-window@example.com");
      const start = new Date(Date.now() + TWO_HOURS_MS);

      for (let index = 0; index < EMAIL_QUOTA_LIMITS.auth; index += 1) {
        expect(await reserveEmailQuota(db, userId, "auth", start)).toBe(true);
      }
      expect(
        await reserveEmailQuota(db, userId, "auth", new Date(start.getTime() + 59 * 60_000)),
      ).toBe(false);
      expect(
        await reserveEmailQuota(db, userId, "auth", new Date(start.getTime() + 61 * 60_000)),
      ).toBe(true);
    });
  });

  it("serializes concurrent reservations so no more than the limit pass", async () => {
    await withTestDb(async (db) => {
      await signUpVerifiedUser(db, {
        name: "Race",
        email: "quota-race@example.com",
        password: "correct-horse",
      });
      const userId = await userIdFor(db, "quota-race@example.com");
      const start = new Date(Date.now() + TWO_HOURS_MS);

      const results = await Promise.all(
        Array.from({ length: 12 }, () => reserveEmailQuota(db, userId, "auth", start)),
      );
      expect(results.filter(Boolean)).toHaveLength(EMAIL_QUOTA_LIMITS.auth);
    });
  });
});
