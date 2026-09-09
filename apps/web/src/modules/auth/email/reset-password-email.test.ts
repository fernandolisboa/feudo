import { describe, expect, it } from "vitest";

import { buildResetPasswordEmail } from "./reset-password-email";

describe("buildResetPasswordEmail", () => {
  it("interpolates the url and the expiry into text and html", () => {
    const email = buildResetPasswordEmail(
      "https://feudo.vercel.app/redefinir-senha?token=abc",
      "1 hora",
    );

    expect(email.subject).toBe("Redefina sua senha no Feudo");
    expect(email.text).toContain("https://feudo.vercel.app/redefinir-senha?token=abc");
    expect(email.text).toContain("1 hora");
    expect(email.html).toContain('href="https://feudo.vercel.app/redefinir-senha?token=abc"');
    expect(email.html).toContain("1 hora");
  });

  it("carries no user-controlled field other than the url, so it cannot be used to inject content", () => {
    const email = buildResetPasswordEmail(
      "https://feudo.vercel.app/redefinir-senha?token=abc",
      "1 hora",
    );

    expect(email.text).not.toContain("{name}");
    expect(email.html).not.toContain("{name}");
  });

  it("escapes ampersands in the url so the html link stays well-formed", () => {
    const email = buildResetPasswordEmail(
      "https://feudo.vercel.app/redefinir-senha?token=abc&callbackURL=/entrar",
      "1 hora",
    );

    expect(email.html).toContain(
      'href="https://feudo.vercel.app/redefinir-senha?token=abc&amp;callbackURL=/entrar"',
    );
    expect(email.text).toContain(
      "https://feudo.vercel.app/redefinir-senha?token=abc&callbackURL=/entrar",
    );
  });
});
