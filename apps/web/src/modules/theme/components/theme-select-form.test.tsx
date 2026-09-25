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
});
