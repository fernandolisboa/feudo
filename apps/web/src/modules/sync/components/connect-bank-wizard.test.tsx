// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { t } from "../strings";

vi.mock("../actions", () => ({
  acceptConsentAction: vi.fn(() => Promise.resolve({ status: "accepted", consentId: "consent-1" })),
  connectProviderAction: vi.fn(),
}));

import { ConnectBankWizard } from "./connect-bank-wizard";

afterEach(() => {
  cleanup();
});

describe("ConnectBankWizard", () => {
  it("links the credentials step to the guide it is given, in a new tab", async () => {
    const { container } = render(<ConnectBankWizard guideHref="/como-usar#meu-pluggy" />);

    await act(() => {
      fireEvent.submit(container.querySelector("form") as HTMLFormElement);
      return Promise.resolve();
    });
    fireEvent.click(await screen.findByRole("button", { name: t.guide.continue }));

    const link = await screen.findByRole("link", { name: t.form.guideLink });
    expect(link.getAttribute("href")).toBe("/como-usar#meu-pluggy");
    expect(link.getAttribute("target")).toBe("_blank");
  });
});
