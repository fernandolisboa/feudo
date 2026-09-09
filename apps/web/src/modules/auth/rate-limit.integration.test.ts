import { beforeEach, describe, expect, it } from "vitest";

import { withTestDb } from "@/db/test/harness";

import { resendVerification, signIn, signUp } from "./service";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

beforeEach(() => {
  process.env.REGISTRATION_MODE = "open";
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
});
