// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const requestAccountDeletionActionMock = vi.hoisted(() => vi.fn());

vi.mock("../actions", () => ({ requestAccountDeletionAction: requestAccountDeletionActionMock }));

import { DeleteAccountSection } from "./delete-account-section";

afterEach(() => {
  cleanup();
  requestAccountDeletionActionMock.mockReset();
});

const props = {
  restorableUntil: "10/10/2026",
  households: [
    {
      name: "Casa Lisboa",
      lines: [
        "Casa Lisboa perde as transações de julho de 2026 a setembro de 2026.",
        "Bia passa a ser o responsável.",
      ],
    },
  ],
  othersAreTold: true,
};

describe("DeleteAccountSection", () => {
  it("shows what each household loses and who takes over before asking for confirmation", async () => {
    requestAccountDeletionActionMock.mockResolvedValue({ status: "error", message: "falhou" });
    render(<DeleteAccountSection {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Excluir meu cadastro" }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByText(/até 10\/10\/2026/i)).toBeTruthy();
    expect(
      within(dialog).getByText(
        "Casa Lisboa perde as transações de julho de 2026 a setembro de 2026.",
      ),
    ).toBeTruthy();
    expect(within(dialog).getByText("Bia passa a ser o responsável.")).toBeTruthy();
    expect(
      within(dialog).getByText(
        "Os outros membros recebem um e-mail dizendo quais meses perdem dados.",
      ),
    ).toBeTruthy();
    expect(requestAccountDeletionActionMock).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir meu cadastro" }));

    expect(await within(dialog).findByText("falhou")).toBeTruthy();
    expect(requestAccountDeletionActionMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the onboarding version to a quiet link with no description", () => {
    render(<DeleteAccountSection {...props} compact />);

    expect(screen.queryByText(/Seu cadastro fica oculto/)).toBeNull();
    expect(screen.getByRole("button", { name: "Excluir meu cadastro" })).toBeTruthy();
  });
});
