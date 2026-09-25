// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { t } from "../strings";

vi.mock("../actions", () => ({ inviteMemberAction: vi.fn() }));

import { InviteMemberDialog } from "./invite-member-dialog";

afterEach(() => {
  cleanup();
});

describe("InviteMemberDialog", () => {
  it("shows the default role's label, not its key", async () => {
    render(<InviteMemberDialog />);

    fireEvent.click(screen.getByRole("button", { name: t.casa.inviteAction }));

    expect(
      within(await screen.findByRole("combobox")).queryByText(t.casa.roles.member),
    ).not.toBeNull();
  });
});
