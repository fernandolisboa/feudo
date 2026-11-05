import { describe, expect, it } from "vitest";

import { canonicalRedirectUrl } from "./canonical-host";

const production = { VERCEL_ENV: "production", BETTER_AUTH_URL: "https://feudo.filx.app" };

describe("canonicalRedirectUrl", () => {
  it("sends a page on the former production host to the canonical one, keeping path and query", () => {
    expect(
      canonicalRedirectUrl(new URL("https://feudo.vercel.app/transacoes?de=2026-07-06"), production)
        ?.href,
    ).toBe("https://feudo.filx.app/transacoes?de=2026-07-06");
  });

  it("sends a production deployment URL to the canonical host", () => {
    expect(
      canonicalRedirectUrl(new URL("https://feudo-abc123-team.vercel.app/convite/abc"), production)
        ?.href,
    ).toBe("https://feudo.filx.app/convite/abc");
  });

  it("leaves the canonical host alone", () => {
    expect(canonicalRedirectUrl(new URL("https://feudo.filx.app/entrar"), production)).toBeNull();
  });

  it("keeps a protocol-relative path on the canonical host", () => {
    const target = canonicalRedirectUrl(
      new URL("https://feudo.vercel.app//evil.test/x"),
      production,
    );
    expect(target?.host).toBe("feudo.filx.app");
    expect(target?.pathname).toBe("//evil.test/x");
  });

  it.each([
    ["a preview", { VERCEL_ENV: "preview", BETTER_AUTH_URL: "https://feudo.filx.app" }],
    ["local development", { BETTER_AUTH_URL: "https://feudo.filx.app" }],
    ["production without BETTER_AUTH_URL", { VERCEL_ENV: "production" }],
    ["production with an empty BETTER_AUTH_URL", { VERCEL_ENV: "production", BETTER_AUTH_URL: "" }],
    [
      "production with a malformed BETTER_AUTH_URL",
      { VERCEL_ENV: "production", BETTER_AUTH_URL: "feudo" },
    ],
  ])("never redirects on %s", (_label, env) => {
    expect(canonicalRedirectUrl(new URL("https://feudo-git-pr-1.vercel.app/"), env)).toBeNull();
  });
});
