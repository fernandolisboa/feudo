// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TOURS } from "@/modules/shell/test/tours";

import { OverviewTabs } from "./overview-tabs";

function isShown(text: string): boolean {
  return screen.getByText(text).closest("[hidden]") === null;
}

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button
      type="button"
      onClick={() => {
        setCount(count + 1);
      }}
    >
      clicked {count}
    </button>
  );
}

const SLOTS = {
  summary: <p>month summary</p>,
  reading: <p>analyst reading</p>,
  accounts: <p>household accounts</p>,
};

beforeEach(() => {
  window.history.replaceState(null, "", "/?mes=2026-09");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("OverviewTabs", () => {
  it("opens on the summary and shows only the open tab's content", () => {
    render(<OverviewTabs initialTab="resumo" {...SLOTS} />);

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Resumo",
      "Leitura do analista",
      "Contas",
    ]);
    expect(isShown("month summary")).toBe(true);
    expect(isShown("analyst reading")).toBe(false);
    expect(isShown("household accounts")).toBe(false);
  });

  it("opens on the tab named in the address", () => {
    render(<OverviewTabs initialTab="contas" {...SLOTS} />);

    expect(screen.getByRole("tab", { name: "Contas" }).getAttribute("aria-selected")).toBe("true");
    expect(isShown("household accounts")).toBe(true);
    expect(isShown("month summary")).toBe(false);
  });

  it("drops the reading tab when the analyst is off, falling back to the summary", () => {
    render(<OverviewTabs initialTab="leitura" {...SLOTS} reading={null} />);

    expect(screen.queryByRole("tab", { name: "Leitura do analista" })).toBeNull();
    expect(isShown("month summary")).toBe(true);
  });

  it("keeps the open tab in the address without dropping the month", () => {
    render(<OverviewTabs initialTab="resumo" {...SLOTS} />);

    fireEvent.click(screen.getByRole("tab", { name: "Leitura do analista" }));
    expect(isShown("analyst reading")).toBe(true);
    expect(window.location.search).toBe("?mes=2026-09&aba=leitura");

    fireEvent.click(screen.getByRole("tab", { name: "Resumo" }));
    expect(window.location.search).toBe("?mes=2026-09");
  });

  it("keeps a hidden tab's state, so a running sync survives a look at another tab", () => {
    render(<OverviewTabs initialTab="contas" {...SLOTS} accounts={<Counter />} />);

    fireEvent.click(screen.getByRole("button", { name: "clicked 0" }));
    fireEvent.click(screen.getByRole("tab", { name: "Resumo" }));
    fireEvent.click(screen.getByRole("tab", { name: "Contas" }));

    expect(screen.getByRole("button", { name: "clicked 1" })).not.toBeNull();
  });

  it("anchors the overview tour's accounts step on the accounts tab", () => {
    const { container } = render(<OverviewTabs initialTab="resumo" {...SLOTS} />);

    const target = container.querySelector(`[data-tour="${TOURS.overview.readyTarget}"]`);
    expect(target).toBe(screen.getByRole("tab", { name: "Contas" }));
    expect(TOURS.overview.steps.map((step) => step.target)).toContain("overview.accounts");
  });
});
