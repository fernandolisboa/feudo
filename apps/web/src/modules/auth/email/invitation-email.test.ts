import { describe, expect, it } from "vitest";

import { buildInvitationEmail } from "./invitation-email";

describe("buildInvitationEmail", () => {
  it("interpolates household, inviter, role and url into text and html", () => {
    const email = buildInvitationEmail({
      url: "https://feudo.vercel.app/convite/abc",
      householdName: "Casa da Ada",
      inviterName: "Ada",
      role: "admin",
      expiresIn: "24 horas",
    });

    expect(email.subject).toBe("Ada convidou você para a casa Casa da Ada no Feudo");
    expect(email.text).toContain("Ada convidou você para entrar na casa Casa da Ada");
    expect(email.text).toContain("como administrador");
    expect(email.text).toContain("https://feudo.vercel.app/convite/abc");
    expect(email.text).toContain("24 horas");
    expect(email.html).toContain('href="https://feudo.vercel.app/convite/abc"');
  });

  it("translates the member role to pt-BR", () => {
    const email = buildInvitationEmail({
      url: "https://feudo.vercel.app/convite/abc",
      householdName: "Casa da Ada",
      inviterName: "Ada",
      role: "member",
      expiresIn: "24 horas",
    });

    expect(email.text).toContain("como membro");
  });

  it("escapes html-significant characters in a household or inviter name", () => {
    const email = buildInvitationEmail({
      url: "https://feudo.vercel.app/convite/abc",
      householdName: "<b>Casa</b>",
      inviterName: "<script>alert(1)</script>",
      role: "member",
      expiresIn: "24 horas",
    });

    expect(email.html).not.toContain("<b>Casa</b>");
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;b&gt;Casa&lt;/b&gt;");
  });
});
