import { describe, expect, it } from "vitest";

import { buildResetPasswordEmail } from "./reset-password-email";

describe("buildResetPasswordEmail", () => {
  it("interpolates the name and the url into text and html", () => {
    const email = buildResetPasswordEmail(
      "Nova User",
      "https://feudo.vercel.app/redefinir-senha?token=abc",
    );

    expect(email.subject).toBe("Redefina sua senha no Feudo");
    expect(email.text).toContain("Olá, Nova User.");
    expect(email.text).toContain("https://feudo.vercel.app/redefinir-senha?token=abc");
    expect(email.html).toContain("Nova User");
    expect(email.html).toContain('href="https://feudo.vercel.app/redefinir-senha?token=abc"');
  });

  it("escapes a malicious name in the html output", () => {
    const maliciousName = '<a href="https://evil.example">Eve</a>';

    const email = buildResetPasswordEmail(
      maliciousName,
      "https://feudo.vercel.app/redefinir-senha?token=abc",
    );

    expect(email.html).not.toContain('<a href="https://evil.example">');
    expect(email.html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;Eve&lt;/a&gt;");
  });

  it("keeps the name as plain text in the text output, which no client renders as markup", () => {
    const maliciousName = '<a href="https://evil.example">Eve</a>';

    const email = buildResetPasswordEmail(
      maliciousName,
      "https://feudo.vercel.app/redefinir-senha?token=abc",
    );

    expect(email.text).toContain(maliciousName);
  });
});
