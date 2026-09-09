import { describe, expect, it } from "vitest";

import {
  describeExpiryPtBR,
  MAGIC_LINK_EXPIRES_IN_SECONDS,
  RESET_PASSWORD_EXPIRES_IN_SECONDS,
} from "./token-expiry";

describe("describeExpiryPtBR", () => {
  it("describes the magic-link expiry in minutes", () => {
    expect(describeExpiryPtBR(MAGIC_LINK_EXPIRES_IN_SECONDS)).toBe("5 minutos");
  });

  it("describes the reset-password expiry in hours", () => {
    expect(describeExpiryPtBR(RESET_PASSWORD_EXPIRES_IN_SECONDS)).toBe("1 hora");
  });

  it("uses the singular form for exactly one minute", () => {
    expect(describeExpiryPtBR(60)).toBe("1 minuto");
  });

  it("uses the plural form for more than one hour", () => {
    expect(describeExpiryPtBR(60 * 60 * 2)).toBe("2 horas");
  });
});
