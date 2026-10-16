import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const { ledger, marker } = vi.hoisted(() => ({
  ledger: { getOverviewPageProps: vi.fn() },
  marker: (name: string) => {
    const component = ({ children }: { children?: ReactNode }) => children ?? null;
    Object.defineProperty(component, "name", { value: name });
    return component;
  },
}));

vi.mock("@/modules/households", () => ({
  requireHouseholdSession: vi.fn().mockResolvedValue({ userId: "user-1", householdId: "h-1" }),
}));
vi.mock("@/modules/ledger", () => ({
  getOverviewPageProps: ledger.getOverviewPageProps,
  OverviewErrorBoundary: marker("OverviewErrorBoundary"),
  OverviewHeader: marker("OverviewHeader"),
  OverviewHeaderErrorBoundary: marker("OverviewHeaderErrorBoundary"),
  OverviewHeaderSkeleton: marker("OverviewHeaderSkeleton"),
  OverviewSkeleton: marker("OverviewSkeleton"),
  OverviewSummary: marker("OverviewSummary"),
  OverviewTabs: marker("OverviewTabs"),
  overviewTabOf: () => "resumo",
}));
vi.mock("@/modules/reserve", () => ({
  getReserveNoticeBannerProps: vi.fn().mockResolvedValue(null),
  ReserveNoticeBanner: marker("ReserveNoticeBanner"),
  ReserveNoticeBannerErrorBoundary: marker("ReserveNoticeBannerErrorBoundary"),
}));
vi.mock("@/modules/sync", () => ({
  AccountsSection: marker("AccountsSection"),
  getAccountsSectionProps: vi.fn().mockResolvedValue({ accounts: [] }),
}));
vi.mock("@/modules/analysis", () => ({
  AnalystReading: marker("AnalystReading"),
  AnalystReadingErrorBoundary: marker("AnalystReadingErrorBoundary"),
  getAnalystReadingProps: vi.fn().mockResolvedValue(null),
  isAnalysisEnabled: () => Promise.resolve(true),
}));
vi.mock("@/platform/db/client", () => ({ getDb: () => ({}) }));

import { OverviewErrorBoundary, OverviewTabs } from "@/modules/ledger";
import { AccountsSection } from "@/modules/sync";

import Home from "./page";

type AnyElement = ReactElement<Record<string, unknown>>;

function findAll(node: unknown, predicate: (element: AnyElement) => boolean): AnyElement[] {
  if (Array.isArray(node)) {
    return node.flatMap((child) => findAll(child, predicate));
  }
  if (!isValidElement(node)) {
    return [];
  }
  const element = node as AnyElement;
  const own = predicate(element) ? [element] : [];
  return [...own, ...findAll(element.props.children, predicate)];
}

function asyncChild(slot: unknown): AnyElement {
  const [element] = findAll(
    slot,
    (candidate) => candidate.type.constructor.name === "AsyncFunction",
  );
  if (!element) {
    throw new Error("slot has no async server component");
  }
  return element;
}

describe("Visão geral page", () => {
  it("keeps the Contas tab working when the overview read fails", async () => {
    ledger.getOverviewPageProps.mockRejectedValue(new Error("ledger down"));
    const page = await Home({ searchParams: Promise.resolve({}) });

    const [tabs] = findAll(page, (element) => element.type === OverviewTabs);
    expect(tabs).toBeDefined();
    expect(findAll(page, (element) => element.type === OverviewErrorBoundary)).toHaveLength(0);

    const summary = tabs?.props.summary;
    expect(isValidElement(summary) && summary.type === OverviewErrorBoundary).toBe(true);
    expect(
      findAll(tabs?.props.accounts, (element) => element.type === OverviewErrorBoundary),
    ).toEqual([]);

    const accounts = asyncChild(tabs?.props.accounts);
    const render = accounts.type as (props: unknown) => Promise<AnyElement>;
    const rendered = await render(accounts.props);
    expect(rendered.type).toBe(AccountsSection);
    expect(ledger.getOverviewPageProps).not.toHaveBeenCalled();
  });

  it("reopens the tabs on the address's own tab when the month changes", async () => {
    ledger.getOverviewPageProps.mockReturnValue(new Promise(() => undefined));
    const august = await Home({ searchParams: Promise.resolve({ mes: "2026-08" }) });
    const september = await Home({ searchParams: Promise.resolve({ mes: "2026-09" }) });

    const keyOf = (page: unknown) =>
      findAll(page, (element) => element.type === OverviewTabs)[0]?.key;
    expect(keyOf(august)).not.toBe(keyOf(september));
  });
});
