import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { withTestDb } from "@/db/test/harness";
import { user } from "@/db/schema/auth.ts";

import { signUp } from "./service";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";

let originalEmailProvider: string | undefined;
let originalResendApiKey: string | undefined;
let originalEmailFrom: string | undefined;

beforeEach(() => {
  originalEmailProvider = process.env.EMAIL_PROVIDER;
  originalResendApiKey = process.env.RESEND_API_KEY;
  originalEmailFrom = process.env.EMAIL_FROM;
  process.env.REGISTRATION_MODE = "open";
  process.env.EMAIL_PROVIDER = "resend";
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
});

afterEach(() => {
  process.env.EMAIL_PROVIDER = originalEmailProvider;
  process.env.RESEND_API_KEY = originalResendApiKey;
  process.env.EMAIL_FROM = originalEmailFrom;
});

describe("signUp when the verification email cannot be sent", () => {
  it("reports a failure instead of a false ok when RESEND_API_KEY is missing", async () => {
    await withTestDb(async (db) => {
      const email = "unsendable@example.com";

      const outcome = await signUp(
        { name: "Unsendable", email, password: "correct-horse", termsAccepted: true },
        new Headers(),
      );

      expect(outcome.status).not.toBe("ok");

      const rows = await db.select().from(user).where(eq(user.email, email));
      expect(rows.length).toBeLessThanOrEqual(1);
    });
  });
});
