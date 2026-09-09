import { describe, expect, it } from "vitest";

import { buildVerificationEmail } from "./verification-email";

describe("buildVerificationEmail", () => {
  it("interpolates the name and the url into text and html", () => {
    const email = buildVerificationEmail("Nova User", "https://feudo.vercel.app/verify?token=abc");

    expect(email.subject).toBe("Confirme seu e-mail no Feudo");
    expect(email.text).toContain("Olá, Nova User.");
    expect(email.text).toContain("https://feudo.vercel.app/verify?token=abc");
    expect(email.html).toContain("Nova User");
    expect(email.html).toContain('href="https://feudo.vercel.app/verify?token=abc"');
  });

  it("escapes a malicious name in the html output", () => {
    const maliciousName = '<a href="https://evil.example">Eve</a>';

    const email = buildVerificationEmail(
      maliciousName,
      "https://feudo.vercel.app/verify?token=abc",
    );

    expect(email.html).not.toContain('<a href="https://evil.example">');
    expect(email.html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;Eve&lt;/a&gt;");
  });

  it("keeps the name as plain text in the text output, which no client renders as markup", () => {
    const maliciousName = '<a href="https://evil.example">Eve</a>';

    const email = buildVerificationEmail(
      maliciousName,
      "https://feudo.vercel.app/verify?token=abc",
    );

    expect(email.text).toContain(maliciousName);
  });

  it("escapes ampersands in the url so the html link stays well-formed", () => {
    const email = buildVerificationEmail(
      "Nova User",
      "https://feudo.vercel.app/verify?token=abc&callbackURL=/entrar",
    );

    expect(email.html).toContain(
      'href="https://feudo.vercel.app/verify?token=abc&amp;callbackURL=/entrar"',
    );
    expect(email.text).toContain("https://feudo.vercel.app/verify?token=abc&callbackURL=/entrar");
  });
});
