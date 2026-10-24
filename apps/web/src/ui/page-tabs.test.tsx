// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { PageTabs } from "./page-tabs";

const TABS = [
  { value: "resumo", label: "Resumo", content: <p>summary</p> },
  { value: "contas", label: "Contas", content: <p>accounts</p>, tourTarget: "page.accounts" },
];

function isShown(text: string): boolean {
  return screen.getByText(text).closest("[hidden]") === null;
}

beforeEach(() => {
  window.history.replaceState(null, "", "/reserva?outro=1");
});

afterEach(() => {
  cleanup();
});

describe("PageTabs", () => {
  it("opens on the first tab when the address names none", () => {
    render(<PageTabs label="Partes" tabs={TABS} initialTab={undefined} />);

    expect(screen.getByRole("tablist", { name: "Partes" })).not.toBeNull();
    expect(isShown("summary")).toBe(true);
    expect(isShown("accounts")).toBe(false);
  });

  it("falls back to the first tab when the address names one that does not exist", () => {
    render(<PageTabs label="Partes" tabs={TABS} initialTab="nada" />);

    expect(isShown("summary")).toBe(true);
  });

  it("opens on the tab the address names", () => {
    render(<PageTabs label="Partes" tabs={TABS} initialTab="contas" />);

    expect(isShown("accounts")).toBe(true);
    expect(isShown("summary")).toBe(false);
  });

  it("keeps the open tab in the address, dropping it for the first tab, and leaves other params alone", () => {
    render(<PageTabs label="Partes" tabs={TABS} initialTab={undefined} />);

    fireEvent.click(screen.getByRole("tab", { name: "Contas" }));
    expect(window.location.search).toBe("?outro=1&aba=contas");

    fireEvent.click(screen.getByRole("tab", { name: "Resumo" }));
    expect(window.location.search).toBe("?outro=1");
  });

  it("anchors a tour step on a tab when asked", () => {
    const { container } = render(<PageTabs label="Partes" tabs={TABS} initialTab={undefined} />);

    expect(container.querySelector('[data-tour="page.accounts"]')).toBe(
      screen.getByRole("tab", { name: "Contas" }),
    );
  });
});
