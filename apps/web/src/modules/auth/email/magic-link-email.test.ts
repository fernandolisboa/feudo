import { describe, expect, it } from "vitest";

import { buildMagicLinkEmail } from "./magic-link-email";

describe("buildMagicLinkEmail", () => {
  it("interpolates the url into text and html", () => {
    const email = buildMagicLinkEmail("https://feudo.vercel.app/magic-link/verify?token=abc");

    expect(email.subject).toBe("Seu link para entrar no Feudo");
    expect(email.text).toContain("https://feudo.vercel.app/magic-link/verify?token=abc");
    expect(email.html).toContain('href="https://feudo.vercel.app/magic-link/verify?token=abc"');
  });

  it("escapes ampersands in the url so the html link stays well-formed", () => {
    const email = buildMagicLinkEmail(
      "https://feudo.vercel.app/magic-link/verify?token=abc&callbackURL=/",
    );

    expect(email.html).toContain(
      'href="https://feudo.vercel.app/magic-link/verify?token=abc&amp;callbackURL=/"',
    );
    expect(email.text).toContain(
      "https://feudo.vercel.app/magic-link/verify?token=abc&callbackURL=/",
    );
  });
});
