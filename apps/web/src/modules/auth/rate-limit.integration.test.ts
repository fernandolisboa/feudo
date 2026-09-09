import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

import { withTestDb } from "@/db/test/harness";
import { rateLimit } from "@/db/schema/auth";

import {
  requestMagicLink,
  requestPasswordReset,
  resendVerification,
  signIn,
  signUp,
} from "./service";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

beforeEach(() => {
  process.env.REGISTRATION_MODE = "open";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("rate limiting on the flows the UI drives through the auth handler", () => {
  it("refuses the 4th rapid sign-in attempt within the window", async () => {
    await withTestDb(async () => {
      const attempt = () =>
        signIn({ email: "nobody@example.com", password: "wrong-password" }, new Headers());

      const first = await attempt();
      const second = await attempt();
      const third = await attempt();
      const fourth = await attempt();

      expect(first.status).toBe("invalid_credentials");
      expect(second.status).toBe("invalid_credentials");
      expect(third.status).toBe("invalid_credentials");
      expect(fourth.status).toBe("rate_limited");
    });
  });

  it("refuses the 4th rapid sign-up attempt within the window", async () => {
    await withTestDb(async () => {
      const email = "sign-up-rate-limit@example.com";
      const attempt = () =>
        signUp(
          { name: "Rate Limited", email, password: "correct-horse", termsAccepted: true },
          new Headers(),
        );

      const first = await attempt();
      const second = await attempt();
      const third = await attempt();
      const fourth = await attempt();

      expect(first.status).toBe("ok");
      expect(second.status).toBe("ok");
      expect(third.status).toBe("ok");
      expect(fourth.status).toBe("rate_limited");
    });
  });

  it("clears the sign-up rate limit once its 10-second window has passed, backed by a single database rate_limit row", async () => {
    await withTestDb(async (db) => {
      const email = "sign-up-rate-limit-clears@example.com";
      const attempt = () =>
        signUp(
          { name: "Rate Limited", email, password: "correct-horse", termsAccepted: true },
          new Headers(),
        );
      const rateLimitKey = "no-trusted-ip|/sign-up/email";

      const first = await attempt();
      expect(first.status).toBe("ok");

      const [rowAfterFirst] = await db
        .select()
        .from(rateLimit)
        .where(eq(rateLimit.key, rateLimitKey));
      expect(rowAfterFirst).toBeDefined();
      expect(rowAfterFirst?.count).toBe(1);

      await attempt();
      await attempt();
      const limited = await attempt();
      expect(limited.status).toBe("rate_limited");

      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(Date.now() + 11_000));

      const afterWindow = await attempt();
      expect(afterWindow.status).toBe("ok");

      const rowsAfterWindow = await db
        .select()
        .from(rateLimit)
        .where(eq(rateLimit.key, rateLimitKey));
      expect(rowsAfterWindow).toHaveLength(1);
      expect(rowsAfterWindow[0]?.count).toBe(1);
    });
  });

  it("refuses the 4th rapid resend-verification request within the window", async () => {
    await withTestDb(async () => {
      const email = "resend-rate-limit@example.com";
      await signUp(
        { name: "Rate Limited", email, password: "correct-horse", termsAccepted: true },
        new Headers(),
      );

      const attempt = () => resendVerification(email, new Headers());

      const first = await attempt();
      const second = await attempt();
      const third = await attempt();
      const fourth = await attempt();

      expect(first.status).toBe("ok");
      expect(second.status).toBe("ok");
      expect(third.status).toBe("ok");
      expect(fourth.status).toBe("rate_limited");
    });
  });

  it("refuses the 4th rapid magic-link request within the window", async () => {
    await withTestDb(async () => {
      const attempt = () => requestMagicLink("magic-link-rate-limit@example.com", new Headers());

      const first = await attempt();
      const second = await attempt();
      const third = await attempt();
      const fourth = await attempt();

      expect(first.status).toBe("ok");
      expect(second.status).toBe("ok");
      expect(third.status).toBe("ok");
      expect(fourth.status).toBe("rate_limited");
    });
  });

  it("refuses the 4th rapid password-reset request within the window", async () => {
    await withTestDb(async () => {
      const attempt = () => requestPasswordReset("reset-rate-limit@example.com", new Headers());

      const first = await attempt();
      const second = await attempt();
      const third = await attempt();
      const fourth = await attempt();

      expect(first.status).toBe("ok");
      expect(second.status).toBe("ok");
      expect(third.status).toBe("ok");
      expect(fourth.status).toBe("rate_limited");
    });
  });

  it("clears the magic-link rate limit once its 10-second window has passed", async () => {
    await withTestDb(async () => {
      const email = "magic-link-rate-limit-clears@example.com";
      const attempt = () => requestMagicLink(email, new Headers());

      await attempt();
      await attempt();
      await attempt();
      const limited = await attempt();
      expect(limited.status).toBe("rate_limited");

      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(Date.now() + 11_000));

      const afterWindow = await attempt();
      expect(afterWindow.status).toBe("ok");
    });
  });

  it("clears the password-reset rate limit once its 60-second window has passed", async () => {
    await withTestDb(async () => {
      const email = "reset-rate-limit-clears@example.com";
      const attempt = () => requestPasswordReset(email, new Headers());

      await attempt();
      await attempt();
      await attempt();
      const limited = await attempt();
      expect(limited.status).toBe("rate_limited");

      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(Date.now() + 61_000));

      const afterWindow = await attempt();
      expect(afterWindow.status).toBe("ok");
    });
  });
});
