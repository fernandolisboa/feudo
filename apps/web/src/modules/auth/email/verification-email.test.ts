import { describe, expect, it } from "vitest";

import { buildVerificationEmail } from "./verification-email";

describe("buildVerificationEmail", () => {
  it("interpolates the url into text and html", () => {
    const email = buildVerificationEmail("https://feudo.vercel.app/verify?token=abc");

    expect(email.subject).toBe("Confirme seu e-mail no Feudo");
    expect(email.text).toContain("https://feudo.vercel.app/verify?token=abc");
    expect(email.html).toContain('href="https://feudo.vercel.app/verify?token=abc"');
  });

  it("carries no user-controlled field other than the url, so it cannot be used to inject content", () => {
    const email = buildVerificationEmail("https://feudo.vercel.app/verify?token=abc");

    expect(email.text).not.toContain("{name}");
    expect(email.html).not.toContain("{name}");
  });

  it("escapes ampersands in the url so the html link stays well-formed", () => {
    const email = buildVerificationEmail(
      "https://feudo.vercel.app/verify?token=abc&callbackURL=/entrar",
    );

    expect(email.html).toContain(
      'href="https://feudo.vercel.app/verify?token=abc&amp;callbackURL=/entrar"',
    );
    expect(email.text).toContain("https://feudo.vercel.app/verify?token=abc&callbackURL=/entrar");
  });
});
