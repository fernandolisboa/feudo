// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PaginatedTable } from "./paginated-table";
import type { PageSize } from "@/lib/page-size";
import { TableCell, TableHead, TableRow } from "./table";

afterEach(cleanup);

const LABELS = {
  nav: "Páginas de contas",
  status: "Página {page} de {pages} · {total} contas",
  rowsPerPage: "Linhas por página",
  previous: "Página anterior",
  next: "Próxima página",
  page: "Página {page}",
};

function renderRows(count: number, pageSize: PageSize = 10) {
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

// The strip as a wide screen shows it: items hidden only under `sm` stay in.
function pageStrip(): string[] {
  return [...screen.getByRole("navigation").querySelectorAll("li")]
    .filter((item) => !item.classList.contains("sm:hidden"))
    .map((item) => item.textContent)
    .filter((text) => text !== "");
}

function bodyRowNames(): string[] {
  return screen
    .getAllByRole("cell")
    .map((cell) => cell.textContent)
    .filter((text) => text.startsWith("Conta "));
}

// Base UI's select commits an option on the full pointer sequence, not on a bare click.
async function chooseRowsPerPage(size: string) {
  fireEvent.click(screen.getByRole("combobox", { name: "Linhas por página" }));
  const option = await screen.findByRole("option", { name: size });
  fireEvent.pointerDown(option, { pointerType: "mouse" });
  fireEvent.mouseDown(option);
  fireEvent.pointerUp(option, { pointerType: "mouse" });
  fireEvent.mouseUp(option);
  fireEvent.click(option);
}

describe("PaginatedTable", () => {
  it("shows one page of rows and says how many pages and rows there are", () => {
    renderRows(16);

    expect(bodyRowNames()).toHaveLength(10);
    expect(bodyRowNames()[0]).toBe("Conta 1");
    expect(screen.getByRole("navigation", { name: "Páginas de contas" })).toBeDefined();
    expect(screen.getByText("Página 1 de 2 · 16 contas")).toBeDefined();
    expect(screen.getByRole("button", { name: "Página anterior" })).toHaveProperty(
      "ariaDisabled",
      "true",
    );
    expect(screen.getByRole("button", { name: "Página 1" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(
      screen.getByRole("button", { name: "Página 2" }).getAttribute("aria-current"),
    ).toBeNull();
  });

  it("jumps straight to a numbered page and marks it as the current one", () => {
    renderRows(95);

    expect(pageStrip()).toEqual(["1", "2", "3", "4", "5", "…", "10"]);

    fireEvent.click(screen.getByRole("button", { name: "Página 10" }));

    expect(bodyRowNames()).toEqual(["Conta 91", "Conta 92", "Conta 93", "Conta 94", "Conta 95"]);
    expect(screen.getByText("Página 10 de 10 · 95 contas")).toBeDefined();
    expect(screen.getByRole("button", { name: "Página 10" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(pageStrip()).toEqual(["1", "…", "6", "7", "8", "9", "10"]);

    fireEvent.click(screen.getByRole("button", { name: "Página 6" }));

    expect(bodyRowNames()[0]).toBe("Conta 51");
    expect(pageStrip()).toEqual(["1", "…", "5", "6", "7", "…", "10"]);
  });

  it("moves to the next page and back", () => {
    renderRows(16);

    fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));

    expect(bodyRowNames()).toEqual([
      "Conta 11",
      "Conta 12",
      "Conta 13",
      "Conta 14",
      "Conta 15",
      "Conta 16",
    ]);
    expect(screen.getByText("Página 2 de 2 · 16 contas")).toBeDefined();
    expect(screen.getByRole("button", { name: "Próxima página" })).toHaveProperty(
      "ariaDisabled",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Página anterior" }));

    expect(bodyRowNames()[0]).toBe("Conta 1");
  });

  it("shows no page navigation when every row fits on the smallest page", () => {
    renderRows(10);

    expect(bodyRowNames()).toHaveLength(10);
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("lets the reader pick the rows per page and recounts the pages", async () => {
    renderRows(36);

    expect(screen.getByText("Página 1 de 4 · 36 contas")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));
    fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(bodyRowNames()[0]).toBe("Conta 21");

    await chooseRowsPerPage("20");

    expect(screen.getByText("Página 2 de 2 · 36 contas")).toBeDefined();
    expect(bodyRowNames()).toHaveLength(16);
    expect(bodyRowNames()[0]).toBe("Conta 21");
  });

  it("keeps the rows-per-page choice but drops page buttons once everything fits", async () => {
    renderRows(16);

    await chooseRowsPerPage("20");

    expect(bodyRowNames()).toHaveLength(16);
    expect(screen.getByText("Página 1 de 1 · 16 contas")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Próxima página" })).toBeNull();
    expect(screen.getByRole("combobox", { name: "Linhas por página" })).toBeDefined();
  });
});
