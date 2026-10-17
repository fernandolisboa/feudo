// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { t } from "../strings";
import { PeriodSwitcher } from "./period-switcher";

afterEach(() => {
  cleanup();
});

describe("PeriodSwitcher", () => {
  it("shows the period label and a link back to the month view", () => {
    render(
      <PeriodSwitcher
        periodLabel="06/07/2026 a 17/10/2026"
        viewByMonthHref="/transacoes?mes=2026-10"
      />,
    );

    expect(screen.getByText("06/07/2026 a 17/10/2026")).not.toBeNull();
    const link = screen.getByRole("link", { name: t.period.viewByMonth });
    expect(link.getAttribute("href")).toBe("/transacoes?mes=2026-10");
  });
});
