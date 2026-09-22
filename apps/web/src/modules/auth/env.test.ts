import { describe, expect, it } from "vitest";

import {
  FakeEmailProviderInProductionError,
  InvalidEmailProviderError,
  InvalidRegistrationModeError,
  isFakeEmailProvider,
  readAuthBaseUrl,
  readEmailProvider,
  readRegistrationMode,
} from "./env";

describe("readRegistrationMode", () => {
  it("defaults to invite when the variable is unset", () => {
    expect(readRegistrationMode({})).toBe("invite");
  });

  it("defaults to invite when the variable is an empty string", () => {
    expect(readRegistrationMode({ REGISTRATION_MODE: "" })).toBe("invite");
  });

  it("returns the parsed value when it is valid", () => {
    expect(readRegistrationMode({ REGISTRATION_MODE: "open" })).toBe("open");
  });

  it("throws for an invalid value", () => {
    expect(() => readRegistrationMode({ REGISTRATION_MODE: "public" })).toThrow(
      InvalidRegistrationModeError,
    );
  });
});

describe("readEmailProvider", () => {
  it("defaults to resend when the variable is unset", () => {
    expect(readEmailProvider({})).toBe("resend");
  });

  it("defaults to resend when the variable is an empty string", () => {
    expect(readEmailProvider({ EMAIL_PROVIDER: "" })).toBe("resend");
  });

  it.each(["resend", "fake"] as const)("returns %s when it is set", (provider) => {
    expect(readEmailProvider({ EMAIL_PROVIDER: provider })).toBe(provider);
  });

  it("throws for an invalid value", () => {
    expect(() => readEmailProvider({ EMAIL_PROVIDER: "sendgrid" })).toThrow(
      InvalidEmailProviderError,
    );
  });

  it("refuses the fake provider in production", () => {
    expect(() => readEmailProvider({ EMAIL_PROVIDER: "fake", VERCEL_ENV: "production" })).toThrow(
      FakeEmailProviderInProductionError,
    );
  });

  it("accepts the fake provider in preview and development", () => {
    expect(readEmailProvider({ EMAIL_PROVIDER: "fake", VERCEL_ENV: "preview" })).toBe("fake");
    expect(readEmailProvider({ EMAIL_PROVIDER: "fake", VERCEL_ENV: "development" })).toBe("fake");
    expect(readEmailProvider({ EMAIL_PROVIDER: "fake" })).toBe("fake");
  });

  it("accepts a real provider in production", () => {
    expect(readEmailProvider({ EMAIL_PROVIDER: "resend", VERCEL_ENV: "production" })).toBe(
      "resend",
    );
  });
});

describe("isFakeEmailProvider", () => {
  it("returns true when EMAIL_PROVIDER is fake", () => {
    expect(isFakeEmailProvider({ EMAIL_PROVIDER: "fake" })).toBe(true);
  });

  it("returns false when EMAIL_PROVIDER is resend or unset", () => {
    expect(isFakeEmailProvider({ EMAIL_PROVIDER: "resend" })).toBe(false);
    expect(isFakeEmailProvider({})).toBe(false);
  });
});

describe("readAuthBaseUrl", () => {
  it("returns the local default when nothing is set", () => {
    expect(readAuthBaseUrl({})).toBe("http://localhost:3000");
  });

  it("prefers BETTER_AUTH_URL when it is set", () => {
    expect(
      readAuthBaseUrl({
        BETTER_AUTH_URL: "https://feudo.vercel.app",
        VERCEL_URL: "feudo-git-pr-1.vercel.app",
      }),
    ).toBe("https://feudo.vercel.app");
  });

  it("treats an empty BETTER_AUTH_URL as unset and falls back to VERCEL_URL", () => {
    expect(readAuthBaseUrl({ BETTER_AUTH_URL: "", VERCEL_URL: "feudo-git-pr-1.vercel.app" })).toBe(
      "https://feudo-git-pr-1.vercel.app",
    );
  });

  it("derives an https URL from VERCEL_URL when BETTER_AUTH_URL is unset", () => {
    expect(readAuthBaseUrl({ VERCEL_URL: "feudo-git-pr-1.vercel.app" })).toBe(
      "https://feudo-git-pr-1.vercel.app",
    );
  });
});
