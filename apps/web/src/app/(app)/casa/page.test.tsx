// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getCasaPagePropsMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/households", async (importOriginal) => ({
  t: (await importOriginal<typeof import("@/modules/households")>()).t,
  requireHouseholdSession: vi.fn().mockResolvedValue({ userId: "user-1", householdId: "h-1" }),
  getCasaPageProps: getCasaPagePropsMock,
  InviteMemberDialog: () => <button type="button">Convidar</button>,
  MembersTable: () => <p>Ana e Bia</p>,
  PendingInvitationsTable: () => <p>convite pendente</p>,
  DeleteHouseholdSection: () => <button type="button">apagar tudo</button>,
}));
vi.mock("@/modules/analysis", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/analysis")>();
  return {
    ...actual,
    AiSettingsErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
    getAiSettingsSectionProps: vi.fn().mockResolvedValue({}),
    AiSettingsSection: () => <p>chave do analista</p>,
  };
});
vi.mock("@/modules/audit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/audit")>();
  return {
    ...actual,
    RecentAccessErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
    getRecentAccessPageProps: vi.fn().mockResolvedValue([]),
    RecentAccessTable: () => <p>acessos recentes</p>,
  };
});

import { resolveServerTree } from "@/lib/test/resolve-server-tree";

import CasaPage from "./page";

const PROPS = {
  members: [],
  viewerRole: "owner",
  canManage: true,
  invitations: [],
  timeZone: "America/Sao_Paulo",
  deletion: { householdName: "Casa", restorableUntil: "01/11/2026" },
};

async function renderPage(searchParams: { aba?: string } = {}) {
  return render(
    await resolveServerTree(await CasaPage({ searchParams: Promise.resolve(searchParams) })),
  );
}

function isShown(text: string): boolean {
  return screen.getByText(text).closest("[hidden]") === null;
}

beforeEach(() => {
  getCasaPagePropsMock.mockReset();
  getCasaPagePropsMock.mockResolvedValue(PROPS);
});

afterEach(() => {
  cleanup();
});

describe("CasaPage", () => {
  it("opens on the people tab, with the analyst, access and delete tabs beside it", async () => {
    await renderPage();

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Pessoas",
      "Analista",
      "Acessos",
      "Excluir",
    ]);
    expect(isShown("Ana e Bia")).toBe(true);
    expect(isShown("convite pendente")).toBe(true);
    expect(isShown("chave do analista")).toBe(false);
    expect(isShown("acessos recentes")).toBe(false);
    expect(isShown("apagar tudo")).toBe(false);
  });

  it("opens on the tab the address names", async () => {
    await renderPage({ aba: "analista" });

    expect(isShown("chave do analista")).toBe(true);
    expect(isShown("Ana e Bia")).toBe(false);
  });

  it("has no delete tab and no pending invites for someone who cannot manage the household", async () => {
    getCasaPagePropsMock.mockResolvedValue({
      ...PROPS,
      viewerRole: "member",
      canManage: false,
      deletion: null,
    });

    await renderPage();

    expect(screen.queryByRole("tab", { name: "Excluir" })).toBeNull();
    expect(screen.queryByText("convite pendente")).toBeNull();
  });
});
