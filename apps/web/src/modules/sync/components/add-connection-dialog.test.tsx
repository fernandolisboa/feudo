// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { t } from "../strings";

vi.mock("../actions", () => ({ addConnectionAction: vi.fn() }));

import { AddConnectionDialog } from "./add-connection-dialog";

afterEach(() => {
  cleanup();
});

describe("AddConnectionDialog", () => {
  it("sends the optional bank name as institutionName", async () => {
    render(<AddConnectionDialog />);

    fireEvent.click(screen.getByRole("button", { name: t.connections.addAction }));

    const input = await screen.findByLabelText(t.form.institutionNameLabel);
    expect(input.getAttribute("name")).toBe("institutionName");
    expect(input.hasAttribute("required")).toBe(false);
  });
});
