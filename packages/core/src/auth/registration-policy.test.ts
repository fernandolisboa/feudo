import { describe, expect, it } from "vitest";
import { evaluateRegistrationMode } from "./registration-policy";

describe("evaluateRegistrationMode", () => {
  it("allows sign-up when the mode is open", () => {
    expect(evaluateRegistrationMode("open", false)).toEqual({ allowed: true });
  });

  it("allows sign-up when the mode is open even with a pending invite", () => {
    expect(evaluateRegistrationMode("open", true)).toEqual({ allowed: true });
  });

  it("refuses sign-up when the mode is closed", () => {
    expect(evaluateRegistrationMode("closed", false)).toEqual({
      allowed: false,
      reason: "registration_closed",
    });
  });

  it("refuses sign-up when the mode is closed even with a pending invite", () => {
    expect(evaluateRegistrationMode("closed", true)).toEqual({
      allowed: false,
      reason: "registration_closed",
    });
  });

  it("refuses sign-up when the mode is invite and there is no pending invite", () => {
    expect(evaluateRegistrationMode("invite", false)).toEqual({
      allowed: false,
      reason: "invite_required",
    });
  });

  it("allows sign-up when the mode is invite and a pending invite exists", () => {
    expect(evaluateRegistrationMode("invite", true)).toEqual({ allowed: true });
  });
});
