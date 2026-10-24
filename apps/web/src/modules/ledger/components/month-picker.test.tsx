// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MonthSwitcher } from "./month-switcher";

afterEach(cleanup);

const LABELS = {
  "2026-10": "outubro de 2026",
  "2025-03": "março de 2025",
  "1970-06": "junho de 1970",
} as const;

function renderSwitcher(month: keyof typeof LABELS = "2026-10") {
  render(
    <MonthSwitcher
      month={month}
      monthLabel={LABELS[month]}
      latestMonth="2026-10"
      monthHref={`/transacoes?mes=${month}&conta=acc-1`}
      previousHref="/transacoes?mes=2026-09&conta=acc-1"
      nextHref={null}
    />,
  );
}

function openPicker(label: string) {
  fireEvent.click(screen.getByRole("button", { name: `Escolher mês, ${label}` }));
}

describe("MonthSwitcher month picker", () => {
  it("shows the month label as the button that opens the picker", () => {
    renderSwitcher();

    expect(screen.getByRole("button", { name: "Escolher mês, outubro de 2026" }).textContent).toBe(
      "outubro de 2026",
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens on the shown month's year, marks it and links every month with the filters kept", async () => {
    renderSwitcher();
    openPicker("outubro de 2026");

    await screen.findByText("2026");
    const october = screen.getByRole("link", { name: "outubro de 2026" });
    expect(october.getAttribute("aria-current")).toBe("date");
    expect(october.textContent).toBe("out");
    expect(screen.getByRole("link", { name: "janeiro de 2026" }).getAttribute("href")).toBe(
      "/transacoes?mes=2026-01&conta=acc-1",
    );
  });

  it("never links a month after the latest one, nor a year after it", async () => {
    renderSwitcher();
    openPicker("outubro de 2026");

    await screen.findByText("2026");
    expect(screen.queryByRole("link", { name: "novembro de 2026" })).toBeNull();
    expect(screen.getByRole("button", { name: "novembro de 2026" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("button", { name: "dezembro de 2026" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("button", { name: "Próximo ano" })).toHaveProperty("disabled", true);
  });

  it("steps back a year and links that year's months", async () => {
    renderSwitcher();
    openPicker("outubro de 2026");

    fireEvent.click(await screen.findByRole("button", { name: "Ano anterior" }));

    screen.getByText("2025");
    expect(screen.getByRole("link", { name: "dezembro de 2025" }).getAttribute("href")).toBe(
      "/transacoes?mes=2025-12&conta=acc-1",
    );
    expect(
      screen.getByRole("link", { name: "outubro de 2025" }).getAttribute("aria-current"),
    ).toBeNull();
    expect(screen.getByRole("button", { name: "Próximo ano" })).toHaveProperty("disabled", false);
  });

  it("opens an earlier month on its own year", async () => {
    renderSwitcher("2025-03");
    openPicker("março de 2025");

    await screen.findByText("2025");
    expect(screen.getByRole("link", { name: "março de 2025" }).getAttribute("aria-current")).toBe(
      "date",
    );
  });

  it("stops at the first year the month links accept", async () => {
    renderSwitcher("1970-06");
    openPicker("junho de 1970");

    expect(await screen.findByRole("button", { name: "Ano anterior" })).toHaveProperty(
      "disabled",
      true,
    );
  });
});
