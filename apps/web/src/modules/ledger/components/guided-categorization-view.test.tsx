// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { categorizeTransactionAction, deferCategorizationAction } = vi.hoisted(() => ({
  categorizeTransactionAction: vi.fn(() => Promise.resolve({ status: "idle" as const })),
  deferCategorizationAction: vi.fn(() => Promise.resolve({ status: "idle" as const })),
}));

vi.mock("../actions", () => ({
  categorizeTransactionAction,
  deferCategorizationAction,
  setTransferMarkAction: vi.fn(),
}));

import { interpolate } from "@/lib/interpolate";

import type { GuidedCategorizationProps, GuidedItemView } from "../guided-categorization";
import { categorizeTransactionFormSchema } from "../validation";
import { t } from "../strings";
import { GuidedCategorizationView } from "./guided-categorization-view";

afterEach(() => {
  cleanup();
  categorizeTransactionAction.mockClear();
  deferCategorizationAction.mockClear();
});

function item(overrides: Partial<GuidedItemView>): GuidedItemView {
  return {
    id: "tx-1",
    description: "TED RECEBIDA EMPRESA X",
    dateLabel: "05/09/2026",
    accountLabel: "Banco · Conta",
    amountLabel: "R$ 9.000,00",
    type: "credit",
    pattern: "TED RECEBIDA EMPRESA X",
    ruleAmountLabel: "R$ 9.000,00",
    sameAmountCount: 0,
    similarCount: 0,
    suggestion: {
      value: "product:income.other",
      label: "Renda · Outras rendas",
      reason: t.guided.suggestion.credit,
    },
    noSuggestionReason: t.guided.suggestion.none,
    deferred: false,
    ...overrides,
  };
}

const ONLY_THIS_AMOUNT = interpolate(t.rules.onlyThisAmount, "{amount}", "R$ 9.000,00");

function props(overrides: Partial<GuidedCategorizationProps>): GuidedCategorizationProps {
  return {
    sinceLabel: "abril de 2026",
    hasAccounts: true,
    items: [item({})],
    categoryGroups: [
      { label: "Renda", options: [{ value: "product:income.other", label: "Outras rendas" }] },
      { label: "Alimentação", options: [{ value: "product:food.groceries", label: "Mercado" }] },
    ],
    ...overrides,
  };
}

describe("GuidedCategorizationView", () => {
  it("shows one transaction at a time with how many are left", () => {
    render(
      <GuidedCategorizationView
        {...props({
          items: [item({}), item({ id: "tx-2", description: "PADARIA DO ZE", type: "debit" })],
        })}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Faltam 2 transações para categorizar",
    );
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("TED RECEBIDA EMPRESA X");
    expect(screen.queryByText("PADARIA DO ZE")).toBeNull();
    expect(screen.getByText("Entrada")).toBeTruthy();
  });

  it("goes straight from the progress to the transaction, with no explainer above it", () => {
    render(<GuidedCategorizationView {...props({ items: [item({})] })} />);

    expect(screen.queryByText(/Uma de cada vez/)).toBeNull();
  });

  it("states the suggestion and its reason, and preselects it", () => {
    const { container } = render(<GuidedCategorizationView {...props({})} />);

    expect(screen.getByText(`${t.guided.suggestion.label}: Renda · Outras rendas`)).toBeTruthy();
    expect(screen.getByText(t.guided.suggestion.credit)).toBeTruthy();
    const hidden = container.querySelector<HTMLInputElement>('input[name="subcategory"]');
    expect(hidden?.value).toBe("product:income.other");
  });

  it("says so when there is no suggestion and leaves the category empty", () => {
    const { container } = render(
      <GuidedCategorizationView {...props({ items: [item({ suggestion: null })] })} />,
    );

    expect(screen.getByText(t.guided.suggestion.none)).toBeTruthy();
    const hidden = container.querySelector<HTMLInputElement>('input[name="subcategory"]');
    expect(hidden?.value ?? "").toBe("");
  });

  it("offers the rule already ticked and bound to the amount when a pending one shares description and amount", () => {
    render(
      <GuidedCategorizationView
        {...props({
          items: [item({ pattern: "UBER TRIP", sameAmountCount: 2, similarCount: 3 })],
        })}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: t.guided.createRule });
    expect(checkbox.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByDisplayValue("UBER TRIP")).toBeTruthy();
    expect(
      screen.getByRole("checkbox", { name: ONLY_THIS_AMOUNT }).getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen.getByText(
        "Mais 2 transações sem categoria têm este texto e este valor e vão receber a mesma categoria.",
      ),
    ).toBeTruthy();
  });

  it("counts every amount once the rule is no longer bound to this one", () => {
    render(
      <GuidedCategorizationView
        {...props({
          items: [item({ pattern: "UBER TRIP", sameAmountCount: 1, similarCount: 3 })],
        })}
      />,
    );

    expect(
      screen.getByText(
        "Mais 1 transação sem categoria tem este texto e este valor e vai receber a mesma categoria.",
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox", { name: ONLY_THIS_AMOUNT }));

    expect(
      screen.getByText(
        "Mais 3 transações sem categoria têm este texto e vão receber a mesma categoria.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/este valor e v/)).toBeNull();
  });

  it("leaves the rule unticked when the description repeats only with other amounts, and unbound once the member ticks it", () => {
    render(
      <GuidedCategorizationView
        {...props({
          items: [item({ pattern: "PIX ENVIADO", sameAmountCount: 0, similarCount: 2 })],
        })}
      />,
    );

    const createRule = screen.getByRole("checkbox", { name: t.guided.createRule });
    expect(createRule.getAttribute("aria-checked")).toBe("false");
    expect(screen.queryByRole("checkbox", { name: ONLY_THIS_AMOUNT })).toBeNull();
    expect(screen.queryByText(/receber a mesma categoria/)).toBeNull();

    fireEvent.click(createRule);

    const onlyThisAmount = screen.getByRole("checkbox", { name: ONLY_THIS_AMOUNT });
    expect(onlyThisAmount.getAttribute("aria-checked")).toBe("false");
    expect(
      screen.getByText(
        "Mais 2 transações sem categoria têm este texto e vão receber a mesma categoria.",
      ),
    ).toBeTruthy();

    fireEvent.click(onlyThisAmount);

    expect(screen.queryByText(/receber a mesma categoria/)).toBeNull();
  });

  it("submits fields the categorize action's schema accepts, rule included", () => {
    const { container } = render(
      <GuidedCategorizationView
        {...props({
          items: [
            item({
              id: "6f1c2b3a-4d5e-4f60-8a9b-0c1d2e3f4a5b",
              pattern: "TED RECEBIDA",
              sameAmountCount: 1,
              similarCount: 1,
            }),
          ],
        })}
      />,
    );

    const form = container.querySelector("form");
    if (!form) throw new Error("form missing");
    const data = new FormData(form);
    const parsed = categorizeTransactionFormSchema.safeParse({
      transactionId: data.get("transactionId"),
      subcategory: data.get("subcategory"),
      createRule: data.get("createRule") === "on" ? "on" : "off",
      pattern: data.get("pattern"),
      direction: data.get("direction"),
      onlyThisAmount: data.get("onlyThisAmount") === "on" ? "on" : "off",
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data).toMatchObject({
      createRule: "on",
      pattern: "TED RECEBIDA",
      direction: "credit",
      onlyThisAmount: "on",
    });
    expect([...data.keys()].sort()).toEqual([
      "createRule",
      "direction",
      "onlyThisAmount",
      "pattern",
      "subcategory",
      "transactionId",
    ]);
  });

  it("gives the reason it was handed when there is no suggestion", () => {
    render(
      <GuidedCategorizationView
        {...props({
          items: [item({ suggestion: null, noSuggestionReason: t.guided.suggestion.conflicting })],
        })}
      />,
    );

    expect(screen.getByText(t.guided.suggestion.conflicting)).toBeTruthy();
    expect(screen.queryByText(t.guided.suggestion.none)).toBeNull();
  });

  it("neither pre-ticks the rule nor offers the amount for a transaction of zero", () => {
    render(
      <GuidedCategorizationView
        {...props({
          items: [
            item({
              pattern: "AJUSTE SEM VALOR",
              ruleAmountLabel: null,
              sameAmountCount: 1,
              similarCount: 1,
            }),
          ],
        })}
      />,
    );

    const createRule = screen.getByRole("checkbox", { name: t.guided.createRule });
    expect(createRule.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(createRule);

    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect(
      screen.getByText(
        "Mais 1 transação sem categoria tem este texto e vai receber a mesma categoria.",
      ),
    ).toBeTruthy();
  });

  it("leaves the rule unticked for a one-off description", () => {
    render(<GuidedCategorizationView {...props({})} />);

    const checkbox = screen.getByRole("checkbox", { name: t.guided.createRule });
    expect(checkbox.getAttribute("aria-checked")).toBe("false");
    expect(screen.queryByLabelText(t.guided.patternLabel)).toBeNull();
  });

  it("leaves a pending one for later through the defer action, with no category chosen", async () => {
    render(
      <GuidedCategorizationView
        {...props({
          items: [
            item({ id: "6f1c2b3a-4d5e-4f60-8a9b-0c1d2e3f4a5b", suggestion: null }),
            item({ id: "tx-2", description: "PADARIA DO ZE" }),
          ],
        })}
      />,
    );

    const deferButton = screen.getByRole("button", { name: t.guided.defer });
    await act(() => {
      (deferButton as HTMLButtonElement).form?.requestSubmit(deferButton);
      return Promise.resolve();
    });

    await waitFor(() => {
      expect(deferCategorizationAction).toHaveBeenCalledTimes(1);
    });
    const [, formData] = deferCategorizationAction.mock.calls[0] as unknown as [unknown, FormData];
    expect(formData.get("transactionId")).toBe("6f1c2b3a-4d5e-4f60-8a9b-0c1d2e3f4a5b");
  });

  it("saves, not defers, when a field submits the form with Enter", async () => {
    const { container } = render(
      <GuidedCategorizationView
        {...props({ items: [item({ id: "6f1c2b3a-4d5e-4f60-8a9b-0c1d2e3f4a5b" })] })}
      />,
    );

    const form = container.querySelector("form");
    const defaultButton = Array.from(form?.elements ?? []).find(
      (element) => element instanceof HTMLButtonElement && element.type === "submit",
    );
    expect(defaultButton?.textContent).toBe(t.guided.save);
    await act(() => {
      form?.requestSubmit();
      return Promise.resolve();
    });

    await waitFor(() => {
      expect(categorizeTransactionAction).toHaveBeenCalledTimes(1);
    });
    expect(deferCategorizationAction).not.toHaveBeenCalled();
  });

  it("shows the ones left for later after all the others, and counts them", () => {
    render(
      <GuidedCategorizationView
        {...props({
          items: [
            item({ deferred: true }),
            item({ id: "tx-2", description: "PADARIA DO ZE" }),
            item({ id: "tx-3", description: "UBER TRIP", deferred: true }),
          ],
        })}
      />,
    );

    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("PADARIA DO ZE");
    expect(screen.getByText("0 de 3 categorizadas · 2 deixadas para depois")).toBeTruthy();
    expect(screen.queryByText(t.guided.deferredNote)).toBeNull();
  });

  it("stops when only the ones left for later remain, and goes through them on request", () => {
    render(
      <GuidedCategorizationView
        {...props({
          items: [
            item({ deferred: true }),
            item({ id: "tx-2", description: "PADARIA DO ZE", deferred: true }),
          ],
        })}
      />,
    );

    expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
    expect(screen.getByText("Só faltam as 2 que você deixou para depois.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: t.guided.review }));
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("TED RECEBIDA EMPRESA X");
    expect(screen.getByText(t.guided.deferredNote)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: t.guided.defer }));
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("PADARIA DO ZE");

    fireEvent.click(screen.getByRole("button", { name: t.guided.defer }));
    expect(screen.getByText("Você deixou as 2 para depois de novo.")).toBeTruthy();
    expect(deferCategorizationAction).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: t.guided.reviewAgain }));
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("TED RECEBIDA EMPRESA X");
  });

  it("counts progress against what was left when the screen opened", () => {
    const { rerender } = render(
      <GuidedCategorizationView
        {...props({ items: [item({}), item({ id: "tx-2" }), item({ id: "tx-3" })] })}
      />,
    );
    rerender(<GuidedCategorizationView {...props({ items: [item({ id: "tx-3" })] })} />);

    expect(screen.getByText("2 de 3 categorizadas")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Falta 1 transação para categorizar",
    );
  });

  it("closes with a way back to the overview when everything has a category", () => {
    render(<GuidedCategorizationView {...props({ items: [] })} />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Tudo desde abril de 2026 já tem categoria",
    );
    expect(screen.getByRole("link", { name: t.guided.doneAction }).getAttribute("href")).toBe("/");
  });

  it("asks for a bank connection when the household has no account", () => {
    render(<GuidedCategorizationView {...props({ hasAccounts: false, items: [] })} />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(t.guided.noAccountsTitle);
    expect(screen.getByRole("link", { name: t.guided.connectAction }).getAttribute("href")).toBe(
      "/conectar-banco",
    );
  });

  it("uses the singular when the one transaction left was left for later", () => {
    render(<GuidedCategorizationView {...props({ items: [item({ deferred: true })] })} />);

    expect(screen.getByText(t.guided.onlyDeferredOne)).toBeTruthy();
    expect(screen.getByText("0 de 1 categorizadas · 1 deixada para depois")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: t.guided.review }));
    fireEvent.click(screen.getByRole("button", { name: t.guided.defer }));

    expect(screen.getByText(t.guided.deferredAgainOne)).toBeTruthy();
  });

  it("does not pre-tick a rule whose proposed text is longer than a rule allows", () => {
    render(
      <GuidedCategorizationView
        {...props({
          items: [item({ pattern: "A".repeat(81), sameAmountCount: 2, similarCount: 2 })],
        })}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: t.guided.createRule });
    expect(checkbox.getAttribute("aria-checked")).toBe("false");
  });

  it("stops promising the similar ones the same category once the rule is unticked", () => {
    render(
      <GuidedCategorizationView
        {...props({
          items: [item({ pattern: "BAZAR DA ESQUINA", sameAmountCount: 2, similarCount: 2 })],
        })}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: t.guided.createRule }));

    expect(screen.queryByText(/vão receber a mesma categoria/)).toBeNull();
  });
});
