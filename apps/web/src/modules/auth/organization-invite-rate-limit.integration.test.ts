import { beforeEach, describe, expect, it } from "vitest";

import { withTestDb } from "@/platform/db/test/harness";

import { getAuth } from "./auth";
import { signUpVerifiedUser } from "./test/sign-up-verified-user";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

beforeEach(() => {
  process.env.REGISTRATION_MODE = "open";
});

function inviteMemberRequest(body: Record<string, unknown>, cookieHeader: string): Request {
  return new Request("http://localhost:3000/api/auth/organization/invite-member", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: cookieHeader },
    body: JSON.stringify(body),
  });
}

describe("rate limiting on the raw /organization/invite-member endpoint (integration)", () => {
  it("refuses the 6th rapid invite in a minute, including a resend", async () => {
    await withTestDb(async (db) => {
      const signUpHeaders = await signUpVerifiedUser(db, {
        name: "Owner",
        email: "invite-rate-limit-owner@example.com",
        password: "correct-horse",
      });
      const cookieHeader = signUpHeaders.get("cookie") ?? "";

      const organization = await getAuth().api.createOrganization({
        headers: signUpHeaders,
        body: { name: "Casa", slug: crypto.randomUUID() },
      });

      const responses: Response[] = [];
      for (let index = 0; index < 5; index += 1) {
        const response = await getAuth().handler(
          inviteMemberRequest(
            {
              email: `invitee-${index.toString()}@example.com`,
              role: "member",
              organizationId: organization.id,
            },
            cookieHeader,
          ),
        );
        responses.push(response);
      }
      expect(responses.every((response) => response.status !== 429)).toBe(true);

      const sixthResponse = await getAuth().handler(
        inviteMemberRequest(
          {
            email: "invitee-0@example.com",
            role: "member",
            organizationId: organization.id,
            resend: true,
          },
          cookieHeader,
        ),
      );
      expect(sixthResponse.status).toBe(429);
    });
  });
});
