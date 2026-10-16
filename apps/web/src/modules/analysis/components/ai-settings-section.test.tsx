// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../actions", () => ({
  saveAiSettingsAction: vi.fn(),
  removeAiKeyAction: vi.fn(),
}));

import type { AiSettingsSectionProps } from "../page-props";
import { AiSettingsSection } from "./ai-settings-section";

function props(overrides: Partial<AiSettingsSectionProps> = {}): AiSettingsSectionProps {
  return {
    canManage: true,
    hasKey: false,
    apiKeyLast4: null,
    monthlyFamily: "opus",
    onDemandFamily: "sonnet",
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("AiSettingsSection", () => {
  it("shows a member the current state with no way to change it", () => {
    render(
      <AiSettingsSection
        {...props({ canManage: false, hasKey: true, apiKeyLast4: "abcd", monthlyFamily: "haiku" })}
      />,
    );

    expect(screen.getByText("Chave atual: •••• abcd")).toBeDefined();
    expect(screen.getByText("Haiku")).toBeDefined();
    expect(screen.getByText("Sonnet")).toBeDefined();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Salvar" })).toBeNull();
  });

  it("tells a member with no key registered that there is none", () => {
    render(<AiSettingsSection {...props({ canManage: false })} />);

    expect(screen.getByText("Nenhuma chave registrada")).toBeDefined();
  });

  it("gives an owner or admin a form to change the key and the families", () => {
    render(<AiSettingsSection {...props()} />);

    expect(screen.getByLabelText("Chave da Anthropic")).toBeDefined();
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDefined();
  });

  it("offers to remove the key only once one is registered", () => {
    const { rerender } = render(<AiSettingsSection {...props({ hasKey: false })} />);
    expect(screen.queryByRole("button", { name: "Remover chave" })).toBeNull();

    rerender(<AiSettingsSection {...props({ hasKey: true, apiKeyLast4: "9xyz" })} />);
    expect(screen.getByRole("button", { name: "Remover chave" })).toBeDefined();
    expect(screen.getByText("Chave atual: •••• 9xyz")).toBeDefined();
  });
});
