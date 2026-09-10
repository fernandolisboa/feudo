import { describe, expect, it } from "vitest";

import {
  createHouseholdFormSchema,
  DEFAULT_TIME_ZONE,
  IANA_TIME_ZONES,
  inviteMemberFormSchema,
  updateMemberRoleFormSchema,
} from "./validation";

describe("createHouseholdFormSchema", () => {
  it("accepts a real IANA time zone", () => {
    const result = createHouseholdFormSchema.safeParse({
      name: "Casa",
      timeZone: "America/Recife",
      reserveMultiple: 6,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a made-up time zone before insert", () => {
    const result = createHouseholdFormSchema.safeParse({
      name: "Casa",
      timeZone: "Not/A_Zone",
      reserveMultiple: 6,
    });
    expect(result.success).toBe(false);
  });

  it("defaults to America/Sao_Paulo", () => {
    const result = createHouseholdFormSchema.safeParse({ name: "Casa" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timeZone).toBe(DEFAULT_TIME_ZONE);
    }
  });

  it("lists America/Sao_Paulo among the selectable IANA zones", () => {
    expect(IANA_TIME_ZONES).toContain(DEFAULT_TIME_ZONE);
  });
});

describe("inviteMemberFormSchema", () => {
  it("accepts an admin or member role", () => {
    expect(
      inviteMemberFormSchema.safeParse({ email: "ada@example.com", role: "admin" }).success,
    ).toBe(true);
    expect(
      inviteMemberFormSchema.safeParse({ email: "ada@example.com", role: "member" }).success,
    ).toBe(true);
  });

  it("rejects inviting someone as owner", () => {
    const result = inviteMemberFormSchema.safeParse({ email: "ada@example.com", role: "owner" });
    expect(result.success).toBe(false);
  });

  it("lower-cases and trims the email", () => {
    const result = inviteMemberFormSchema.safeParse({
      email: "  Ada@Example.com  ",
      role: "member",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("ada@example.com");
    }
  });

  it("rejects a malformed email", () => {
    const result = inviteMemberFormSchema.safeParse({ email: "not-an-email", role: "member" });
    expect(result.success).toBe(false);
  });
});

describe("updateMemberRoleFormSchema", () => {
  it("rejects setting a member's role to owner", () => {
    const result = updateMemberRoleFormSchema.safeParse({ memberId: "member-1", role: "owner" });
    expect(result.success).toBe(false);
  });
});
