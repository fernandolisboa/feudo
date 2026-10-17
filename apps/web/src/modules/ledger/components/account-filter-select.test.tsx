// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LedgerAccount } from "../repository";
import { t } from "../strings";
import { transactionsRouteFixture as route } from "../test/transactions-route";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { AccountFilterSelect } from "./account-filter-select";

const accounts: LedgerAccount[] = [
  { id: "d55d31d4-7294-4ae7-9184-27f1dbb0a001", name: "Conta Corrente", institutionName: "Itaú" },
  { id: "d55d31d4-7294-4ae7-9184-27f1dbb0a002", name: "Poupança", institutionName: "Nubank" },
];

afterEach(() => {
  cleanup();
});

describe("AccountFilterSelect", () => {
  it("shows the all-accounts label when no account is selected", () => {
    render(<AccountFilterSelect route={route()} accounts={accounts} />);

    expect(within(screen.getByRole("combobox")).queryByText(t.accountFilter.all)).not.toBeNull();
  });

  it("shows the selected account's institution and name, not its id", () => {
    render(
      <AccountFilterSelect
        route={route({ accountId: "d55d31d4-7294-4ae7-9184-27f1dbb0a002" })}
        accounts={accounts}
      />,
    );

    expect(within(screen.getByRole("combobox")).queryByText("Nubank · Poupança")).not.toBeNull();
  });
});
