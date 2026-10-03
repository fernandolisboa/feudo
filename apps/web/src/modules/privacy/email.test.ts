import { describe, expect, it } from "vitest";

import { buildAccountDeletionRequestedEmail, buildMemberDepartureEmail } from "./email";

describe("buildAccountDeletionRequestedEmail", () => {
  it("names the purge date and links to the cancel page", () => {
    const email = buildAccountDeletionRequestedEmail({
      purgeDate: "10/10/2026",
      cancelUrl: "https://feudo.example/exclusao-agendada",
    });
    expect(email.subject).toBe("Seu cadastro no Feudo será apagado em 10/10/2026");
    expect(email.text).toContain(
      "Entre antes de 10/10/2026 e cancele: https://feudo.example/exclusao-agendada",
    );
    expect(email.html).toContain('href="https://feudo.example/exclusao-agendada"');
  });
});

describe("buildMemberDepartureEmail", () => {
  const base = {
    name: "Ana",
    householdName: "Casa Lisboa",
    purgeDate: "10/10/2026",
    successorName: null,
  };

  it("tells the member which months lose transactions", () => {
    const email = buildMemberDepartureEmail({
      ...base,
      accounts: 2,
      months: ["2026-07", "2026-08", "2026-09"],
    });
    expect(email.subject).toBe("Ana vai sair da casa Casa Lisboa no Feudo");
    expect(email.text).toContain(
      "Em 10/10/2026, as contas bancárias que Ana conectou saem da casa Casa Lisboa, e com elas as transações de julho de 2026 a setembro de 2026.",
    );
  });

  it("says no month loses data when the accounts have no transactions", () => {
    const email = buildMemberDepartureEmail({ ...base, accounts: 1, months: [] });
    expect(email.text).toContain("Elas não têm transações, então nenhum mês perde dados.");
  });

  it("says no month loses data when the person connected nothing here", () => {
    const email = buildMemberDepartureEmail({ ...base, accounts: 0, months: [] });
    expect(email.text).toContain("Ana não conectou contas bancárias à casa Casa Lisboa");
  });

  it("names the successor when ownership passes on", () => {
    const email = buildMemberDepartureEmail({
      ...base,
      accounts: 0,
      months: [],
      successorName: "Bia",
    });
    expect(email.text).toContain("Bia passa a ser o responsável pela casa.");
  });

  it("escapes names in the HTML body", () => {
    const email = buildMemberDepartureEmail({
      ...base,
      name: "<b>Ana</b>",
      accounts: 0,
      months: [],
    });
    expect(email.html).not.toContain("<b>Ana</b>");
    expect(email.html).toContain("&lt;b&gt;Ana&lt;/b&gt;");
  });
});
