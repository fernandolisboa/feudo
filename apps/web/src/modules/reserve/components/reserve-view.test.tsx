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
    coverage: null,
    notice: null,
    positions: [],
    ranking: null,
    institutionOptions: [],
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

  it("shows coverage in reais, share and months with a progress bar", () => {
    render(
      <ReserveView
        {...buildProps({
          coverage: {
            summaryLabel: "R$ 2.525,11 de R$ 5.883,00",
            percentLabel: "42,9%",
            monthsLabel: "2,5 meses de custo fixo",
            progressPercent: 42.92,
          },
        })}
      />,
    );

    expect(screen.getByText("R$ 2.525,11 de R$ 5.883,00")).not.toBeNull();
    expect(screen.getByText("42,9% · 2,5 meses de custo fixo")).not.toBeNull();
    expect(
      screen
        .getByRole("progressbar", { name: t.coverage.progressLabel })
        .getAttribute("aria-valuenow"),
    ).toBe("42.92");
  });

  it("shows the top placements, then the also-ranked ones with their place and the excluded ones with their reasons", () => {
    const row = (accountId: string, place: number) => ({
      accountId,
      placeLabel: `${String(place)}º`,
      name: `Conta ${accountId}`,
      institutionLabel: "Inter",
      realYieldLabel: "8% a.a.",
      netYieldLabel: "13,6% a.a. depois do IR",
      taxLabel: "17,5%",
      guaranteeLabel: "FGC: ainda cabem R$ 236.749,25",
    });
    render(
      <ReserveView
        {...buildProps({
          ranking: {
            top: [row("a", 1), row("b", 2), row("c", 3)],
            alsoRanked: [row("d", 4)],
            excluded: [
              {
                accountId: "e",
                name: "LCI Fixture",
                institutionLabel: "Inter",
                reasonsLabel: t.ranking.reasons.liquidity_unknown,
              },
            ],
            indicatorsLabel: "Taxas ao ano: CDI 14,9% · Selic 15% · IPCA em 12 meses 5,2%",
          },
        })}
      />,
    );

    const top = screen.getByRole("list", { name: t.ranking.title });
    expect(within(top).getAllByRole("listitem")).toHaveLength(3);
    expect(within(top).getByText("1º")).not.toBeNull();
    const also = screen.getByRole("list", { name: t.ranking.alsoTitle });
    expect(within(also).getByText("4º")).not.toBeNull();
    expect(within(also).getByText(t.ranking.reasons.liquidity_unknown)).not.toBeNull();
    expect(screen.getByText(/CDI 14,9%/)).not.toBeNull();
  });

  it("says so when nothing passes the filter", () => {
    render(
      <ReserveView
        {...buildProps({
          ranking: { top: [], alsoRanked: [], excluded: [], indicatorsLabel: "" },
        })}
      />,
    );

    expect(screen.getByText(t.ranking.empty)).not.toBeNull();
    expect(screen.queryByRole("list", { name: t.ranking.alsoTitle })).toBeNull();
  });

  it("lists every account with its liquidity, tax, real yield, reserve tag and advice", () => {
    render(
      <ReserveView
        {...buildProps({
          positions: [
            {
              accountId: "lci",
              name: "LCI Fixture 92% CDI",
              institutionLabel: "Inter",
              balanceLabel: "R$ 4.000,00",
              liquidityLabel: t.liquidity.unknown,
              liquidityUnknown: true,
              taxLabel: t.tax.exempt,
              realYieldLabel: "7,3% a.a.",
              isReserve: true,
              advice: { label: t.positions.advice.liquidity_unknown, tone: "warning" },
              edit: {
                isReserve: true,
                liquidity: "unknown",
                institutionChoice: "auto",
                asksLiquidity: true,
                asksInstitution: true,
                automaticInstitutionName: "Inter",
              },
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("LCI Fixture 92% CDI")).not.toBeNull();
    expect(screen.getByText(t.liquidity.unknown).className).toContain("text-warning");
    expect(screen.getByText(t.positions.advice.liquidity_unknown).className).toContain(
      "text-warning",
    );
    expect(screen.getByText(t.positions.inReserve)).not.toBeNull();
    expect(screen.getByRole("button", { name: "Ajustar LCI Fixture 92% CDI" })).not.toBeNull();
  });

  it("shows positions and the ranking even before there is a target", () => {
    render(
      <ReserveView
        {...buildProps({
          hasHistory: false,
          tiles: null,
          ranking: { top: [], alsoRanked: [], excluded: [], indicatorsLabel: "" },
        })}
      />,
    );

    expect(screen.getByRole("link", { name: t.empty.categorizeAction })).not.toBeNull();
    expect(screen.getByText(t.ranking.title)).not.toBeNull();
    expect(screen.getByText(t.positions.title)).not.toBeNull();
    expect(screen.queryByText(t.monthlyTable.title)).toBeNull();
  });
});
