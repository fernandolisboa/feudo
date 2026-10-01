// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import type { ReservePageProps } from "../page-props";
import { t } from "../strings";
import { ReserveView } from "./reserve-view";

function buildProps(overrides: Partial<ReservePageProps> = {}): ReservePageProps {
  return {
    monthLabel: "setembro de 2026",
    multiple: 6,
    canManage: true,
    hasAccounts: true,
    hasHistory: true,
    headline: "Sua meta é R$ 5.883,00.",
    tiles: {
      target: { label: t.tiles.target, value: "R$ 5.883,00", meta: "6 meses de custo fixo" },
      averageFixedCost: {
        label: t.tiles.averageFixedCost,
        value: "R$ 980,50",
        meta: "média de 6 meses",
      },
      currentReserve: {
        label: t.tiles.currentReserve,
        value: "—",
        meta: t.tiles.currentReserveMeta,
      },
      coverage: { label: t.tiles.coverage, value: "—", meta: t.tiles.coverageMeta },
    },
    monthlyFixedCosts: [
      { monthLabel: "abril de 2026", amountLabel: "R$ 980,50" },
      { monthLabel: "maio de 2026", amountLabel: null },
    ],
    notice: null,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("ReserveView", () => {
  it("shows the no-accounts empty state and no tiles", () => {
    render(
      <ReserveView
        {...buildProps({ hasAccounts: false, headline: t.headline.noAccounts, tiles: null })}
      />,
    );

    expect(screen.getByRole("link", { name: t.empty.connectAction })).not.toBeNull();
    expect(screen.queryByText(t.tiles.target)).toBeNull();
    expect(screen.getByRole("heading", { name: t.headline.noAccounts })).not.toBeNull();
  });

  it("shows the no-history empty state with a link to transactions when there are accounts but nothing categorized", () => {
    render(
      <ReserveView
        {...buildProps({
          hasAccounts: true,
          hasHistory: false,
          headline: t.headline.noHistory,
          tiles: null,
        })}
      />,
    );

    const link = screen.getByRole("link", { name: t.empty.categorizeAction });
    expect(link.getAttribute("href")).toBe("/transacoes");
    expect(screen.getByRole("heading", { name: t.headline.noHistory })).not.toBeNull();
  });

  it("renders the headline and the four stat tiles once there is a target", () => {
    render(<ReserveView {...buildProps()} />);

    expect(screen.getByRole("heading", { name: "Sua meta é R$ 5.883,00." })).not.toBeNull();
    expect(screen.getByText(t.tiles.target)).not.toBeNull();
    expect(screen.getByText(t.tiles.averageFixedCost)).not.toBeNull();
    expect(screen.getByText(t.tiles.currentReserve)).not.toBeNull();
    expect(screen.getByText(t.tiles.coverage)).not.toBeNull();
  });

  it("shows the monthly fixed-cost table, with a gap label for a month with nothing categorized", () => {
    render(<ReserveView {...buildProps()} />);

    const table = screen.getByRole("table");
    expect(within(table).getByText("abril de 2026")).not.toBeNull();
    expect(within(table).getByText("R$ 980,50")).not.toBeNull();
    expect(within(table).getByText(t.monthlyTable.gap)).not.toBeNull();
  });

  it("shows the reserve multiple selector with the current multiple when the viewer can manage settings", () => {
    render(<ReserveView {...buildProps({ multiple: 9, canManage: true })} />);

    expect(within(screen.getByRole("combobox")).getByText("9")).not.toBeNull();
  });

  it("shows the multiple read-only, with no select, when the viewer is a member", () => {
    render(<ReserveView {...buildProps({ multiple: 9, canManage: false })} />);

    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByText("9 meses")).not.toBeNull();
  });

  it("shows the notice panel with a dismiss action when there is an undismissed notice", () => {
    render(
      <ReserveView
        {...buildProps({
          notice: {
            id: "notice-1",
            message:
              "A meta da reserva mudou de R$ 5.000,00 para R$ 6.000,00 no fechamento de agosto de 2026.",
          },
        })}
      />,
    );

    const notice = screen.getByRole("status");
    expect(within(notice).getByText(/A meta da reserva mudou/)).not.toBeNull();
    expect(within(notice).getByRole("button", { name: t.notice.action })).not.toBeNull();
  });

  it("does not show the notice panel when there is nothing undismissed", () => {
    render(<ReserveView {...buildProps({ notice: null })} />);

    expect(screen.queryByRole("status")).toBeNull();
  });
});
