// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

afterEach(cleanup);

function renderTable(stackOnNarrow?: boolean) {
  const { container } = render(
    <Table stackOnNarrow={stackOnNarrow}>
      <TableHeader>
        <TableRow>
          <TableHead>Conta</TableHead>
          <TableHead>Saldo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell card="title">CDB - NU FINANCEIRA S.A. - SOCIEDADE DE CREDITO</TableCell>
          <TableCell label="Saldo">R$ 1.234,56</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  const tableContainer = container.querySelector("[data-slot=table-container]");
  if (!(tableContainer instanceof HTMLElement)) {
    throw new Error("table container not rendered");
  }
  return tableContainer;
}

describe("Table", () => {
  it("never scrolls sideways: no horizontal overflow container and cells may wrap", () => {
    const tableContainer = renderTable();

    expect(tableContainer.className).not.toContain("overflow-x-auto");
    for (const cell of screen.getAllByRole("cell")) {
      expect(cell.className).not.toContain("whitespace-nowrap");
    }
  });

  it("marks the tables that turn into cards on narrow widths", () => {
    expect(renderTable(true).hasAttribute("data-stack")).toBe(true);
    cleanup();
    expect(renderTable(false).hasAttribute("data-stack")).toBe(false);
  });

  it("carries each cell's card role and label for the stacked layout", () => {
    renderTable(true);

    const [title, balance] = screen.getAllByRole("cell");
    expect(title?.dataset.card).toBe("title");
    expect(balance?.dataset.label).toBe("Saldo");
  });

  it("keeps table semantics explicit so stacked rows still read as rows and cells", () => {
    renderTable(true);

    expect(screen.getByRole("table")).toBeDefined();
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
  });
});
