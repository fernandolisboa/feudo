import { describe, expect, it } from "vitest";

import { createHouseholdFormSchema, DEFAULT_TIME_ZONE, IANA_TIME_ZONES } from "./validation";

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
