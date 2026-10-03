import { beforeEach, describe, expect, it, vi } from "vitest";

const currentHeaders = vi.hoisted(() => ({ value: new Headers() }));
vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(currentHeaders.value),
}));

import {
  getAuth,
  getCurrentSession,
  getPendingAccountDeletion,
  type EmailSender,
} from "@/modules/auth";
import { signUpVerifiedUser } from "@/modules/auth/test/sign-up-verified-user";
import { withTestDb } from "@/platform/db/test/harness";

import { cancelAccountDeletion, requestAccountDeletion } from "./service";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

const silentSender: EmailSender = { send: () => Promise.resolve() };

beforeEach(() => {
  process.env.REGISTRATION_MODE = "open";
  currentHeaders.value = new Headers();
});

async function signIn(email: string, password: string): Promise<Headers> {
  const response = await getAuth().api.signInEmail({
    body: { email, password },
    asResponse: true,
  });
  const cookie = response.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
  return new Headers({ cookie });
}

describe("a pending account deletion and the session (integration)", () => {
  it("signs the user out everywhere, lets them back in only to cancel, and restores them on cancel", async () => {
    await withTestDb(async (db) => {
      const email = "saindo@example.com";
      const password = "correct-horse";
      const firstHeaders = await signUpVerifiedUser(db, { name: "Saindo", email, password });
      currentHeaders.value = firstHeaders;
      const session = await getCurrentSession();
      if (!session) {
        throw new Error("not signed in");
      }

      const outcome = await requestAccountDeletion(session, db, {
        emailSender: silentSender,
        now: new Date(),
        cancelUrl: "https://feudo.test/exclusao-agendada",
      });
      expect(outcome.status).toBe("ok");

      expect(await getCurrentSession()).toBeNull();
      expect(await getPendingAccountDeletion()).toBeNull();

      const secondHeaders = await signIn(email, password);
      currentHeaders.value = secondHeaders;
      expect(await getCurrentSession()).toBeNull();
      const pending = await getPendingAccountDeletion();
      expect(pending?.email).toBe(email);

      await expect(
        getAuth().api.createOrganization({
          headers: secondHeaders,
          body: { name: "Casa nova", slug: crypto.randomUUID() },
        }),
      ).rejects.toThrow("account_deletion_pending");
      await expect(
        getAuth().api.updateUser({ headers: secondHeaders, body: { name: "Outro nome" } }),
      ).rejects.toThrow("account_deletion_pending");

      if (!pending) {
        throw new Error("no pending deletion");
      }
      expect(await cancelAccountDeletion(pending, db)).toEqual({ status: "ok" });
      expect((await getCurrentSession())?.email).toBe(email);
      expect(await getPendingAccountDeletion()).toBeNull();
    });
  });
});
