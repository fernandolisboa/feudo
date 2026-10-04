// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const createHouseholdActionMock = vi.hoisted(() => vi.fn());

vi.mock("../actions", () => ({ createHouseholdAction: createHouseholdActionMock }));

import { OnboardingForm } from "./onboarding-form";

afterEach(() => {
  cleanup();
  createHouseholdActionMock.mockReset();
  Reflect.deleteProperty(window.navigator, "onLine");
});

describe("OnboardingForm", () => {
  it("offline, with no app shell around it, says nothing was sent and never calls the server", async () => {
    Object.defineProperty(window.navigator, "onLine", { configurable: true, get: () => false });
    render(<OnboardingForm />);

    fireEvent.change(screen.getByLabelText("Nome da casa"), { target: { value: "Casa Lisboa" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar casa" }));

    expect(
      await screen.findByText(
        "Você está sem conexão: nada foi enviado. Tente de novo quando a internet voltar.",
      ),
    ).toBeTruthy();
    expect(createHouseholdActionMock).not.toHaveBeenCalled();
  });
});
