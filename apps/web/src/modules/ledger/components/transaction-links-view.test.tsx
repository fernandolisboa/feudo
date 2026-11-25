// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../actions", () => ({
  confirmAllLinksAction: vi.fn(),
  confirmLinkAction: vi.fn(),
  dismissLinkAction: vi.fn(),
}));

import { interpolate } from "@/lib/interpolate";
import type { LinkSuggestionRow } from "../link-suggestions-page-props";
import { t } from "../strings";
import { TransactionLinksView } from "./transaction-links-view";

afterEach(() => {
  cleanup();
});

function suggestion(overrides: Partial<LinkSuggestionRow> = {}): LinkSuggestionRow {
  return {
    debitTransactionId: "debit-1",
    creditTransactionId: "credit-1",
    kind: "offset",
    dateLabel: "10/09/2026",
    amountLabel: "R$ 150,00",
    accountLabel: "Banco Fixture · Conta corrente",
    debitDescription: "PIX ENVIADO FULANO",
    creditDescription: "PIX RECEBIDO CICLANO",
    kindLabel: t.links.kind.offset,
    ...overrides,
  };
}

describe("TransactionLinksView", () => {
  it("shows the empty state consistent with the Categorias tab's own, with no suggestions", () => {
    render(<TransactionLinksView items={[]} pendingCount={0} />);

    expect(screen.getByText(t.links.empty)).toBeTruthy();
  });

  it("lists a suggestion's date, amount, account, both descriptions and kind in words, with Vincular and Não é vínculo", () => {
    const item = suggestion();
    render(<TransactionLinksView items={[item]} pendingCount={1} />);

    expect(screen.getByText(item.dateLabel)).toBeTruthy();
    expect(screen.getByText(item.amountLabel)).toBeTruthy();
    expect(screen.getByText(item.accountLabel)).toBeTruthy();
    expect(screen.getByText(item.debitDescription)).toBeTruthy();
    expect(screen.getByText(item.creditDescription)).toBeTruthy();
    expect(screen.getByText(t.links.kind.offset)).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: interpolate(
          interpolate(t.links.confirmFor, "{description}", item.debitDescription),
          "{counterpartDescription}",
          item.creditDescription,
        ),
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: interpolate(
          interpolate(t.links.dismissFor, "{description}", item.debitDescription),
          "{counterpartDescription}",
          item.creditDescription,
        ),
      }),
    ).toBeTruthy();
  });

  it("offers one Vincular todos action per kind only when there is more than one of that kind", () => {
    const items = [
      suggestion({ debitTransactionId: "d1", creditTransactionId: "c1", kind: "offset" }),
      suggestion({ debitTransactionId: "d2", creditTransactionId: "c2", kind: "offset" }),
      suggestion({
        debitTransactionId: "d3",
        creditTransactionId: "c3",
        kind: "funding",
        kindLabel: t.links.kind.funding,
      }),
    ];
    render(<TransactionLinksView items={items} pendingCount={items.length} />);

    expect(
      screen.getByRole("button", {
        name: interpolate(t.links.confirmAllOffset, "{count}", "2"),
      }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", {
        name: interpolate(t.links.confirmAllFunding, "{count}", "1"),
      }),
    ).toBeNull();
  });
});
