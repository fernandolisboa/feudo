import { describe, expect, it } from "vitest";

import { currentConsentScopeText } from "./consent-text";

// The consent text is what a user accepts before connecting a bank, so it
// must say what the code does (ADR-0008, #98).
describe("currentConsentScopeText", () => {
  const text = currentConsentScopeText();

  it("does not claim that revoking at Meu Pluggy removes what Feudo already read", () => {
    expect(text).not.toContain("tem o mesmo efeito");
    expect(text).toContain(
      "Revogar o acesso do Feudo no Meu Pluggy só interrompe as próximas sincronizações",
    );
  });

  it("says household members see the transactions, not only accounts and balances", () => {
    expect(text).toContain("veem as contas, os saldos e as transações");
  });

  it("names Anthropic as the recipient of the analyst's input", () => {
    expect(text).toContain("Anthropic");
  });
});
