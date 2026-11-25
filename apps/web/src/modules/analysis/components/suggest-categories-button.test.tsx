// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../actions", () => ({
  requestCategorySuggestionsAction: vi.fn(),
}));

import { requestCategorySuggestionsAction } from "../actions";
import { t } from "../strings";
import { SuggestCategoriesButton } from "./suggest-categories-button";

afterEach(() => {
  cleanup();
});

describe("SuggestCategoriesButton", () => {
  it("renders the pending count and the quota with tabular numerals", () => {
    render(<SuggestCategoriesButton pendingCount={12} remaining={4} limit={5} />);

    const pending = screen.getByText("12 transações sem sugestão.");
    const quota = screen.getByText("Restam 4 de 5 pedidos hoje");
    expect(pending.className).toContain("tabular-nums");
    expect(quota.className).toContain("tabular-nums");
  });

  it("uses the singular quota wording with one request left", () => {
    render(<SuggestCategoriesButton pendingCount={3} remaining={1} limit={5} />);

    expect(screen.getByText("Resta 1 de 5 pedidos hoje")).toBeDefined();
  });

  it("shows a non-destructive status for a non-error outcome", async () => {
    vi.mocked(requestCategorySuggestionsAction).mockResolvedValue({
      status: "info",
      message: t.categorySuggestions.outcomes.nothingToSuggest,
    });

    render(<SuggestCategoriesButton pendingCount={1} remaining={5} limit={5} />);
    fireEvent.click(screen.getByRole("button", { name: t.categorySuggestions.button }));

    const status = await screen.findByRole("status");
    expect(status.textContent).toBe(t.categorySuggestions.outcomes.nothingToSuggest);
    expect(status.className).toContain("text-muted-foreground");
    expect(status.className).not.toContain("text-destructive");
  });

  it("keeps the destructive style only for a real failure", async () => {
    vi.mocked(requestCategorySuggestionsAction).mockResolvedValue({
      status: "error",
      message: t.categorySuggestions.outcomes.failed,
    });

    render(<SuggestCategoriesButton pendingCount={1} remaining={5} limit={5} />);
    fireEvent.click(screen.getByRole("button", { name: t.categorySuggestions.button }));

    const status = await screen.findByRole("status");
    expect(status.textContent).toBe(t.categorySuggestions.outcomes.failed);
    expect(status.className).toContain("text-destructive");
  });
});
