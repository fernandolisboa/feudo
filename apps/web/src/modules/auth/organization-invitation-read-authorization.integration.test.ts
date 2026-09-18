import { beforeEach, describe, expect, it } from "vitest";

import { withTestDb } from "@/platform/db/test/harness";

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

function organizationEndpointRequestWithQuery(
  path: string,
  query: Record<string, string>,
  cookieHeader: string,
) {
  const url = new URL(`/api/auth${path}`, readAuthBaseUrl());
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
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

  it("still refuses a plain member with an empty ?organizationId= query, falling back to the active household", async () => {
    await withTestDb(async (db) => {
      const ownerHeaders = await signUpVerifiedUser(db, {
        name: "Owner",
        email: "list-invitations-empty-query-owner@example.com",
        password: "correct-horse",
      });

      const organization = await getAuth().api.createOrganization({
        headers: ownerHeaders,
        body: { name: "Casa", slug: crypto.randomUUID() },
      });

      const memberHeaders = await signUpVerifiedUser(db, {
        name: "Plain Member",
        email: "list-invitations-empty-query-member@example.com",
        password: "correct-horse",
      });
      const memberCookie = memberHeaders.get("cookie") ?? "";
      const memberSession = await getAuth().api.getSession({ headers: memberHeaders });
      if (!memberSession) throw new Error("member sign-in failed in test setup");
      await getAuth().api.addMember({
        body: { userId: memberSession.user.id, organizationId: organization.id, role: "member" },
      });
      await getAuth().api.setActiveOrganization({
        headers: memberHeaders,
        body: { organizationId: organization.id },
      });

      const memberResponse = await getAuth().handler(
        organizationEndpointRequestWithQuery(
          "/organization/list-invitations",
          { organizationId: "" },
          memberCookie,
        ),
      );
      expect(memberResponse.status).toBe(403);
    });
  });

  it("still refuses a plain member with no query at all, falling back to the active household", async () => {
    await withTestDb(async (db) => {
      const ownerHeaders = await signUpVerifiedUser(db, {
        name: "Owner",
        email: "list-invitations-no-query-owner@example.com",
        password: "correct-horse",
      });

      const organization = await getAuth().api.createOrganization({
        headers: ownerHeaders,
        body: { name: "Casa", slug: crypto.randomUUID() },
      });

      const memberHeaders = await signUpVerifiedUser(db, {
        name: "Plain Member",
        email: "list-invitations-no-query-member@example.com",
        password: "correct-horse",
      });
      const memberCookie = memberHeaders.get("cookie") ?? "";
      const memberSession = await getAuth().api.getSession({ headers: memberHeaders });
      if (!memberSession) throw new Error("member sign-in failed in test setup");
      await getAuth().api.addMember({
        body: { userId: memberSession.user.id, organizationId: organization.id, role: "member" },
      });
      await getAuth().api.setActiveOrganization({
        headers: memberHeaders,
        body: { organizationId: organization.id },
      });

      const memberResponse = await getAuth().handler(
        organizationEndpointRequestWithQuery("/organization/list-invitations", {}, memberCookie),
      );
      expect(memberResponse.status).toBe(403);
    });
  });
});

describe("raw /organization/get-full-organization authorization (integration)", () => {
  it("refuses a plain member but lets an owner get the full organization", async () => {
    await withTestDb(async (db) => {
      const ownerHeaders = await signUpVerifiedUser(db, {
        name: "Owner",
        email: "full-org-owner@example.com",
        password: "correct-horse",
      });
      const ownerCookie = ownerHeaders.get("cookie") ?? "";

      const organization = await getAuth().api.createOrganization({
        headers: ownerHeaders,
        body: { name: "Casa", slug: crypto.randomUUID() },
      });

      const memberHeaders = await signUpVerifiedUser(db, {
        name: "Plain Member",
        email: "full-org-member@example.com",
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
          "/organization/get-full-organization",
          organization.id,
          memberCookie,
        ),
      );
      expect(memberResponse.status).toBe(403);

      const ownerResponse = await getAuth().handler(
        organizationEndpointRequest(
          "/organization/get-full-organization",
          organization.id,
          ownerCookie,
        ),
      );
      expect(ownerResponse.status).toBe(200);
    });
  });

  it("still lets an admin get the full organization", async () => {
    await withTestDb(async (db) => {
      const ownerHeaders = await signUpVerifiedUser(db, {
        name: "Owner",
        email: "full-org-admin-owner@example.com",
        password: "correct-horse",
      });

      const organization = await getAuth().api.createOrganization({
        headers: ownerHeaders,
        body: { name: "Casa", slug: crypto.randomUUID() },
      });

      const adminHeaders = await signUpVerifiedUser(db, {
        name: "Admin",
        email: "full-org-admin@example.com",
        password: "correct-horse",
      });
      const adminCookie = adminHeaders.get("cookie") ?? "";
      const adminSession = await getAuth().api.getSession({ headers: adminHeaders });
      if (!adminSession) throw new Error("admin sign-in failed in test setup");
      await getAuth().api.addMember({
        body: { userId: adminSession.user.id, organizationId: organization.id, role: "admin" },
      });

      const adminResponse = await getAuth().handler(
        organizationEndpointRequest(
          "/organization/get-full-organization",
          organization.id,
          adminCookie,
        ),
      );
      expect(adminResponse.status).toBe(200);
    });
  });

  it("resolves organizationSlug the same way as organizationId and still refuses a plain member", async () => {
    await withTestDb(async (db) => {
      const ownerHeaders = await signUpVerifiedUser(db, {
        name: "Owner",
        email: "full-org-slug-owner@example.com",
        password: "correct-horse",
      });

      const slug = crypto.randomUUID();
      const organization = await getAuth().api.createOrganization({
        headers: ownerHeaders,
        body: { name: "Casa", slug },
      });

      const memberHeaders = await signUpVerifiedUser(db, {
        name: "Plain Member",
        email: "full-org-slug-member@example.com",
        password: "correct-horse",
      });
      const memberCookie = memberHeaders.get("cookie") ?? "";
      const memberSession = await getAuth().api.getSession({ headers: memberHeaders });
      if (!memberSession) throw new Error("member sign-in failed in test setup");
      await getAuth().api.addMember({
        body: { userId: memberSession.user.id, organizationId: organization.id, role: "member" },
      });

      const memberResponse = await getAuth().handler(
        organizationEndpointRequestWithQuery(
          "/organization/get-full-organization",
          { organizationSlug: slug },
          memberCookie,
        ),
      );
      expect(memberResponse.status).toBe(403);
    });
  });
});
