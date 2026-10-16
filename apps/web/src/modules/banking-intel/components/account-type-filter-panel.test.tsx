// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountTypeFilter } from "@feudo/core";

const updateAccountTypeFilterActionMock = vi.hoisted(() => vi.fn());

vi.mock("../actions", () => ({
  updateAccountTypeFilterAction: updateAccountTypeFilterActionMock,
}));

import { t } from "../strings";
import { AccountTypeFilterPanel, AccountTypeFilterReadOnly } from "./account-type-filter-panel";

const FILTER: AccountTypeFilter = {
  jointBanking: "optional",
  jointOnly: false,
  jointInvestment: "optional",
  mei: "optional",
};

beforeEach(() => {
  updateAccountTypeFilterActionMock
    .mockReset()
    .mockResolvedValue({ status: "success", message: t.saved });
});

afterEach(() => {
  cleanup();
});

function jointRow(): HTMLElement {
  return screen.getByText(t.accountTypes.filters.jointBanking.label).closest("li") as HTMLElement;
}

describe("AccountTypeFilterPanel", () => {
  it("hides the joint-only checkbox until Money together is set to Required", () => {
    render(<AccountTypeFilterPanel filter={FILTER} />);

    expect(screen.queryByText(t.accountTypes.jointOnly)).toBeNull();

    fireEvent.click(within(jointRow()).getByRole("button", { name: t.accountTypes.levelRequired }));

    expect(screen.getByText(t.accountTypes.jointOnly)).not.toBeNull();
  });

  it("hides the joint-only checkbox again once Money together goes back to Optional", () => {
    render(<AccountTypeFilterPanel filter={{ ...FILTER, jointBanking: "required" }} />);

    expect(screen.getByText(t.accountTypes.jointOnly)).not.toBeNull();

    fireEvent.click(within(jointRow()).getByRole("button", { name: t.accountTypes.levelOptional }));

    expect(screen.queryByText(t.accountTypes.jointOnly)).toBeNull();
  });

  it("saves the whole filter as soon as one row changes, without waiting for a submit", async () => {
    render(<AccountTypeFilterPanel filter={FILTER} />);

    fireEvent.click(within(jointRow()).getByRole("button", { name: t.accountTypes.levelRequired }));

    await waitFor(() => {
      expect(updateAccountTypeFilterActionMock).toHaveBeenCalledTimes(1);
    });
    const postedForm = updateAccountTypeFilterActionMock.mock.calls[0]?.[1] as FormData;
    expect(postedForm.get("jointBanking")).toBe("required");
    expect(postedForm.get("jointOnly")).toBe("false");
    expect(postedForm.get("jointInvestment")).toBe("optional");
    expect(postedForm.get("mei")).toBe("optional");
  });

  it("posts the joint-only checkbox once it is checked", async () => {
    render(<AccountTypeFilterPanel filter={{ ...FILTER, jointBanking: "required" }} />);

    fireEvent.click(screen.getByRole("checkbox", { name: t.accountTypes.jointOnly }));

    await waitFor(() => {
      expect(updateAccountTypeFilterActionMock).toHaveBeenCalledTimes(1);
    });
    const postedForm = updateAccountTypeFilterActionMock.mock.calls[0]?.[1] as FormData;
    expect(postedForm.get("jointOnly")).toBe("true");
  });

  it("shows the server's refusal next to the panel", async () => {
    updateAccountTypeFilterActionMock.mockResolvedValue({
      status: "error",
      message: t.errors.failed,
    });
    render(<AccountTypeFilterPanel filter={FILTER} />);

    fireEvent.click(within(jointRow()).getByRole("button", { name: t.accountTypes.levelRequired }));

    expect((await screen.findByRole("alert")).textContent).toBe(t.errors.failed);
  });

  it("reverts to the server's filter after a rejected save, instead of keeping the failed draft", async () => {
    updateAccountTypeFilterActionMock.mockResolvedValueOnce({
      status: "error",
      message: t.errors.failed,
    });
    render(<AccountTypeFilterPanel filter={FILTER} />);

    fireEvent.click(within(jointRow()).getByRole("button", { name: t.accountTypes.levelRequired }));
    await screen.findByText(t.errors.failed);

    expect(
      within(jointRow())
        .getByRole("button", { name: t.accountTypes.levelOptional })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });
});

describe("AccountTypeFilterReadOnly", () => {
  it("shows every row's current level without any control to change it", () => {
    render(
      <AccountTypeFilterReadOnly
        filter={{ ...FILTER, jointBanking: "required", jointOnly: true }}
      />,
    );

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(within(jointRow()).getByText(t.accountTypes.levelRequired)).not.toBeNull();
    expect(screen.getByText(t.accountTypes.jointOnly)).not.toBeNull();
    expect(screen.getByText(t.accountTypes.readOnly)).not.toBeNull();
  });
});
