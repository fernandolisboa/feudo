// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { t } from "../strings";

vi.mock("../actions", () => ({ updateThemeAction: vi.fn() }));

import { ThemeSelectForm } from "./theme-select-form";

afterEach(() => {
  cleanup();
});

describe("ThemeSelectForm", () => {
  it("shows the current theme's display name, not its key", () => {
    render(<ThemeSelectForm currentTheme="painel" />);

    expect(
      within(screen.getByRole("combobox")).queryByText(t.preferences.themeNames.painel),
    ).not.toBeNull();
  });

  it("previews the current theme with a swatch scoped to that theme's tokens", () => {
    const { container } = render(<ThemeSelectForm currentTheme="lamparina" />);

    const swatch = container.querySelector(".theme-swatch");
    expect(swatch?.getAttribute("data-theme")).toBe("lamparina");
    expect(swatch?.getAttribute("aria-hidden")).toBe("true");
  });
});
