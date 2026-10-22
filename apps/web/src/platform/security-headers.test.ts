import { describe, expect, it } from "vitest";

import { contentSecurityPolicy, createNonce, STATIC_SECURITY_HEADERS } from "./security-headers";

function directives(policy: string): Map<string, string> {
  return new Map(
    policy.split("; ").map((directive) => {
      const [name = "", ...sources] = directive.split(" ");
      return [name, sources.join(" ")];
    }),
  );
}

describe("contentSecurityPolicy", () => {
  it("allows scripts only through the nonce", () => {
    const script = directives(contentSecurityPolicy("abc123", false)).get("script-src");
    expect(script).toBe("'self' 'nonce-abc123' 'strict-dynamic'");
  });

  it("allows eval only in development", () => {
    expect(contentSecurityPolicy("n", true)).toContain("'unsafe-eval'");
    expect(contentSecurityPolicy("n", false)).not.toContain("'unsafe-eval'");
  });

  it("forbids framing, plugins and a foreign base or form target", () => {
    const policy = directives(contentSecurityPolicy("n", false));
    expect(policy.get("frame-ancestors")).toBe("'none'");
    expect(policy.get("object-src")).toBe("'none'");
    expect(policy.get("base-uri")).toBe("'self'");
    expect(policy.get("form-action")).toBe("'self'");
    expect(policy.get("default-src")).toBe("'self'");
  });

  it("keeps a nonce out of style-src, where it would switch off the inline styles React writes", () => {
    expect(directives(contentSecurityPolicy("n", false)).get("style-src")).toBe(
      "'self' 'unsafe-inline'",
    );
  });
});

describe("createNonce", () => {
  it("draws 128 random bits, base64-encoded", () => {
    const nonce = createNonce();
    expect(Buffer.from(nonce, "base64")).toHaveLength(16);
    expect(createNonce()).not.toBe(nonce);
  });
});

describe("STATIC_SECURITY_HEADERS", () => {
  it("denies framing and sniffing and trims the referrer", () => {
    const headers = new Map(STATIC_SECURITY_HEADERS.map(({ key, value }) => [key, value]));
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
  });
});
