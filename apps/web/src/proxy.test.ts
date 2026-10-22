import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { config, proxy } from "./proxy";

function nonceOf(policy: string | null): string | undefined {
  return /'nonce-([^']+)'/.exec(policy ?? "")?.[1];
}

describe("proxy", () => {
  it("puts the same nonced policy on the request Next renders and on the response", () => {
    const response = proxy(new NextRequest("https://feudo.test/entrar"));
    const policy = response.headers.get("content-security-policy");
    expect(nonceOf(policy)).toBeDefined();
    expect(response.headers.get("x-middleware-request-content-security-policy")).toBe(policy);
  });

  it("draws a fresh nonce for every request", () => {
    const first = proxy(new NextRequest("https://feudo.test/entrar"));
    const second = proxy(new NextRequest("https://feudo.test/entrar"));
    expect(nonceOf(first.headers.get("content-security-policy"))).not.toBe(
      nonceOf(second.headers.get("content-security-policy")),
    );
  });

  it.each(["/", "/entrar", "/transacoes", "/bancos/itau", "/convite/abc"])(
    "runs on the page %s",
    (url) => {
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
    },
  );

  it.each([
    "/api/health",
    "/api/auth/sign-in/email",
    "/_next/static/chunks/main.js",
    "/_next/image",
    "/sw.js",
    "/manifest.webmanifest",
    "/favicon.ico",
  ])("skips %s, which renders no page", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false);
  });

  it("skips router prefetches", () => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        url: "/transacoes",
        headers: { "next-router-prefetch": "1" },
      }),
    ).toBe(false);
  });
});
