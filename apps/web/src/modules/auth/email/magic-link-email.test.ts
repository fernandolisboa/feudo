import { describe, expect, it } from "vitest";

import { buildMagicLinkEmail } from "./magic-link-email";

describe("buildMagicLinkEmail", () => {
  it("interpolates the url and the expiry into text and html", () => {
    const email = buildMagicLinkEmail(
      "https://feudo.vercel.app/magic-link/verify?token=abc",
      "5 minutos",
    );

    expect(email.subject).toBe("Seu link para entrar no Feudo");
    expect(email.text).toContain("https://feudo.vercel.app/magic-link/verify?token=abc");
    expect(email.text).toContain("5 minutos");
    expect(email.html).toContain('href="https://feudo.vercel.app/magic-link/verify?token=abc"');
    expect(email.html).toContain("5 minutos");
  });

  it("escapes ampersands in the url so the html link stays well-formed", () => {
    const email = buildMagicLinkEmail(
      "https://feudo.vercel.app/magic-link/verify?token=abc&callbackURL=/",
      "5 minutos",
    );

    expect(email.html).toContain(
      'href="https://feudo.vercel.app/magic-link/verify?token=abc&amp;callbackURL=/"',
    );
    expect(email.text).toContain(
      "https://feudo.vercel.app/magic-link/verify?token=abc&callbackURL=/",
    );
  });
});
