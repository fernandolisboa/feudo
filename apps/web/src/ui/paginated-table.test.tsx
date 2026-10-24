// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PaginatedTable } from "./paginated-table";
import { TableCell, TableHead, TableRow } from "./table";

afterEach(cleanup);

const LABELS = {
  nav: "Páginas de contas",
  status: "Página {page} de {pages} · {total} contas",
  previous: "Anteriores",
  next: "Próximas",
};

function renderRows(count: number, pageSize = 10) {
  render(
    <PaginatedTable
      pageSize={pageSize}
      labels={LABELS}
      header={
        <TableRow>
          <TableHead>Conta</TableHead>
        </TableRow>
      }
      rows={Array.from({ length: count }, (_, index) => (
        <TableRow key={index}>
          <TableCell>{`Conta ${String(index + 1)}`}</TableCell>
        </TableRow>
      ))}
    />,
  );
}

function bodyRowNames(): string[] {
  return screen
    .getAllByRole("cell")
    .map((cell) => cell.textContent)
    .filter((text) => text.startsWith("Conta "));
}

describe("PaginatedTable", () => {
  it("shows one page of rows and says how many pages and rows there are", () => {
    renderRows(16);

    expect(bodyRowNames()).toHaveLength(10);
    expect(bodyRowNames()[0]).toBe("Conta 1");
    expect(screen.getByRole("navigation", { name: "Páginas de contas" })).toBeDefined();
    expect(screen.getByText("Página 1 de 2 · 16 contas")).toBeDefined();
    expect(screen.getByRole("button", { name: "Anteriores" })).toHaveProperty("disabled", true);
  });

  it("moves to the next page and back", () => {
    renderRows(16);

    fireEvent.click(screen.getByRole("button", { name: "Próximas" }));

    expect(bodyRowNames()).toEqual([
      "Conta 11",
      "Conta 12",
      "Conta 13",
      "Conta 14",
      "Conta 15",
      "Conta 16",
    ]);
    expect(screen.getByText("Página 2 de 2 · 16 contas")).toBeDefined();
    expect(screen.getByRole("button", { name: "Próximas" })).toHaveProperty("disabled", true);

    fireEvent.click(screen.getByRole("button", { name: "Anteriores" }));

    expect(bodyRowNames()[0]).toBe("Conta 1");
  });

  it("shows no page navigation when every row fits on one page", () => {
    renderRows(10);

    expect(bodyRowNames()).toHaveLength(10);
    expect(screen.queryByRole("navigation")).toBeNull();
  });
});
