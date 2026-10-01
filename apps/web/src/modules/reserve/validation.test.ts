import { describe, expect, it } from "vitest";

import { dismissNoticeFormSchema, updateReserveMultipleFormSchema } from "./validation";

describe("updateReserveMultipleFormSchema", () => {
  it("accepts the minimum multiple (3)", () => {
    expect(updateReserveMultipleFormSchema.safeParse({ reserveMultiple: "3" }).success).toBe(true);
  });

  it("accepts the maximum multiple (12)", () => {
    expect(updateReserveMultipleFormSchema.safeParse({ reserveMultiple: "12" }).success).toBe(true);
  });

  it("rejects a multiple below the minimum", () => {
    expect(updateReserveMultipleFormSchema.safeParse({ reserveMultiple: "2" }).success).toBe(false);
  });

  it("rejects a multiple above the maximum", () => {
    expect(updateReserveMultipleFormSchema.safeParse({ reserveMultiple: "13" }).success).toBe(
      false,
    );
  });

  it("rejects a non-integer multiple", () => {
    expect(updateReserveMultipleFormSchema.safeParse({ reserveMultiple: "6.5" }).success).toBe(
      false,
    );
  });

  it("rejects a missing multiple", () => {
    expect(updateReserveMultipleFormSchema.safeParse({}).success).toBe(false);
  });

  it("coerces a form field's string value to a number", () => {
    const result = updateReserveMultipleFormSchema.safeParse({ reserveMultiple: "9" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reserveMultiple).toBe(9);
    }
  });
});

describe("dismissNoticeFormSchema", () => {
  it("accepts a non-empty notice id", () => {
    expect(dismissNoticeFormSchema.safeParse({ noticeId: "notice-1" }).success).toBe(true);
  });

  it("rejects an empty notice id", () => {
    expect(dismissNoticeFormSchema.safeParse({ noticeId: "" }).success).toBe(false);
  });

  it("rejects a missing notice id", () => {
    expect(dismissNoticeFormSchema.safeParse({}).success).toBe(false);
  });
});
