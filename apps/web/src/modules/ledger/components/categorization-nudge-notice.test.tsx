// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const usePathnameMock = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ usePathname: usePathnameMock }));

import { t } from "../strings";
import { CategorizationNudgeNotice } from "./categorization-nudge-notice";

beforeEach(() => {
  usePathnameMock.mockReset().mockReturnValue("/reserva");
  document.cookie = "categorization-nudge-hidden=; max-age=0; path=/";
});
afterEach(cleanup);

const PROPS = {
  householdId: "household-a",
  count: 28,
  amountLabel: "R$ 57.092,73",
  sinceLabel: "abril de 2026",
};

describe("CategorizationNudgeNotice", () => {
  it("says how many are uncategorized since when, and that the overview is incomplete", () => {
    render(<CategorizationNudgeNotice {...PROPS} />);

    expect(screen.getByRole("status").textContent).toContain(
      "28 transações desde abril de 2026 estão sem categoria (R$ 57.092,73). Enquanto elas não tiverem uma, os números da Visão geral ficam incompletos.",
    );
  });

  it("uses the singular for one transaction", () => {
    render(<CategorizationNudgeNotice {...PROPS} count={1} amountLabel="R$ 10,00" />);

    expect(screen.getByRole("status").textContent).toContain(
      "1 transação desde abril de 2026 está sem categoria (R$ 10,00).",
    );
  });

  it("leads to guided categorization", () => {
    render(<CategorizationNudgeNotice {...PROPS} />);

    expect(screen.getByRole("link", { name: t.nudge.action }).getAttribute("href")).toBe(
      "/categorizar",
    );
  });

  it.each(["/categorizar", "/transacoes"])("stays out of %s, which has its own way in", (path) => {
    usePathnameMock.mockReturnValue(path);
    render(<CategorizationNudgeNotice {...PROPS} />);

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("hides on dismiss and remembers it for this household in a cookie for 7 days", () => {
    render(<CategorizationNudgeNotice {...PROPS} />);

    fireEvent.click(screen.getByRole("button", { name: t.nudge.dismiss }));

    expect(screen.queryByRole("status")).toBeNull();
    expect(document.cookie).toContain("categorization-nudge-hidden=household-a");
  });
});
