// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { t } from "../strings";

vi.mock("../actions", () => ({ updateLayoutAction: vi.fn() }));

import { LayoutSelectForm } from "./layout-select-form";

afterEach(() => {
  cleanup();
});

describe("LayoutSelectForm", () => {
  it("shows the current layout's display name, not its key", () => {
    render(<LayoutSelectForm currentLayout="dock" />);

    const trigger = screen.getByRole("combobox");
    expect(within(trigger).queryByText(t.preferences.layoutNames.dock)).not.toBeNull();
    expect(within(trigger).queryByText("dock")).toBeNull();
  });
});
