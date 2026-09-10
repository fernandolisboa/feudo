import { beforeEach, describe, expect, it } from "vitest";

import { withTestDb } from "@/db/test/harness";

import { getAuth } from "./auth";
import { readAuthBaseUrl } from "./env";
import { signUpVerifiedUser } from "./test/sign-up-verified-user";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

beforeEach(() => {
  process.env.REGISTRATION_MODE = "open";
});

function organizationEndpointRequest(path: string, organizationId: string, cookieHeader: string) {
  const url = new URL(`/api/auth${path}`, readAuthBaseUrl());
  url.searchParams.set("organizationId", organizationId);
  return new Request(url, { headers: { cookie: cookieHeader } });
}

describe("raw /organization/list-invitations authorization (integration)", () => {
  it("refuses a plain member but lets an owner list invitations", async () => {
    await withTestDb(async (db) => {
      const ownerHeaders = await signUpVerifiedUser(db, {
        name: "Owner",
        email: "list-invitations-owner@example.com",
        password: "correct-horse",
      });
      const ownerCookie = ownerHeaders.get("cookie") ?? "";

      const organization = await getAuth().api.createOrganization({
        headers: ownerHeaders,
        body: { name: "Casa", slug: crypto.randomUUID() },
      });

      const memberHeaders = await signUpVerifiedUser(db, {
        name: "Plain Member",
        email: "list-invitations-member@example.com",
        password: "correct-horse",
      });
      const memberCookie = memberHeaders.get("cookie") ?? "";
      const memberSession = await getAuth().api.getSession({ headers: memberHeaders });
      if (!memberSession) throw new Error("member sign-in failed in test setup");
      await getAuth().api.addMember({
        body: { userId: memberSession.user.id, organizationId: organization.id, role: "member" },
      });

      const memberResponse = await getAuth().handler(
        organizationEndpointRequest(
          "/organization/list-invitations",
          organization.id,
          memberCookie,
        ),
      );
      expect(memberResponse.status).toBe(403);

      const ownerResponse = await getAuth().handler(
        organizationEndpointRequest("/organization/list-invitations", organization.id, ownerCookie),
      );
      expect(ownerResponse.status).toBe(200);
    });
  });

  it("still lets a plain member list members", async () => {
    await withTestDb(async (db) => {
      const ownerHeaders = await signUpVerifiedUser(db, {
        name: "Owner",
        email: "list-members-owner@example.com",
        password: "correct-horse",
      });

      const organization = await getAuth().api.createOrganization({
        headers: ownerHeaders,
        body: { name: "Casa", slug: crypto.randomUUID() },
      });

      const memberHeaders = await signUpVerifiedUser(db, {
        name: "Plain Member",
        email: "list-members-member@example.com",
        password: "correct-horse",
      });
      const memberCookie = memberHeaders.get("cookie") ?? "";
      const memberSession = await getAuth().api.getSession({ headers: memberHeaders });
      if (!memberSession) throw new Error("member sign-in failed in test setup");
      await getAuth().api.addMember({
        body: { userId: memberSession.user.id, organizationId: organization.id, role: "member" },
      });

      const memberResponse = await getAuth().handler(
        organizationEndpointRequest("/organization/list-members", organization.id, memberCookie),
      );
      expect(memberResponse.status).toBe(200);
    });
  });

  it("still lets an admin list invitations", async () => {
    await withTestDb(async (db) => {
      const ownerHeaders = await signUpVerifiedUser(db, {
        name: "Owner",
        email: "list-invitations-admin-owner@example.com",
        password: "correct-horse",
      });

      const organization = await getAuth().api.createOrganization({
        headers: ownerHeaders,
        body: { name: "Casa", slug: crypto.randomUUID() },
      });

      const adminHeaders = await signUpVerifiedUser(db, {
        name: "Admin",
        email: "list-invitations-admin@example.com",
        password: "correct-horse",
      });
      const adminCookie = adminHeaders.get("cookie") ?? "";
      const adminSession = await getAuth().api.getSession({ headers: adminHeaders });
      if (!adminSession) throw new Error("admin sign-in failed in test setup");
      await getAuth().api.addMember({
        body: { userId: adminSession.user.id, organizationId: organization.id, role: "admin" },
      });

      const adminResponse = await getAuth().handler(
        organizationEndpointRequest("/organization/list-invitations", organization.id, adminCookie),
      );
      expect(adminResponse.status).toBe(200);
    });
  });
});
