// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { t } from "../strings";
import { RecentAccessTable } from "./recent-access-table";

afterEach(cleanup);

function entries(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `access-${String(index + 1)}`,
    kindLabel: `Acesso ${String(index + 1)}`,
    whenLabel: "24/10/2026, 10:51",
  }));
}

function listedKinds(): string[] {
  return screen
    .getAllByRole("cell")
    .map((cell) => cell.textContent)
    .filter((text) => text.startsWith("Acesso "));
}

describe("RecentAccessTable", () => {
  it("pages a long access history ten at a time and stacks into cards on narrow screens", () => {
    const { container } = render(<RecentAccessTable entries={entries(25)} />);

    expect(listedKinds()).toHaveLength(10);
    expect(screen.getByRole("navigation", { name: t.recentAccess.pagination.nav })).toBeDefined();
    expect(screen.getByText("Página 1 de 3 · 25 acessos")).toBeDefined();
    expect(container.querySelector("[data-stack]")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: t.recentAccess.pagination.next }));

    expect(listedKinds()[0]).toBe("Acesso 11");
  });

  it("says there is nothing yet instead of an empty table", () => {
    render(<RecentAccessTable entries={[]} />);

    expect(screen.getByText(t.recentAccess.empty)).toBeDefined();
    expect(screen.queryByRole("table")).toBeNull();
  });
});
