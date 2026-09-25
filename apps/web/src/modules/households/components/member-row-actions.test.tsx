// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const updateMemberRoleActionMock = vi.hoisted(() => vi.fn());
const leaveHouseholdActionMock = vi.hoisted(() => vi.fn());
const removeMemberActionMock = vi.hoisted(() => vi.fn());
const transferOwnershipActionMock = vi.hoisted(() => vi.fn());

vi.mock("../actions", () => ({
  updateMemberRoleAction: updateMemberRoleActionMock,
  leaveHouseholdAction: leaveHouseholdActionMock,
  removeMemberAction: removeMemberActionMock,
  transferOwnershipAction: transferOwnershipActionMock,
}));

import { MemberRowActions } from "./member-row-actions";
import type { HouseholdMember } from "../membership";
import { t } from "../strings";

afterEach(() => {
  cleanup();
  updateMemberRoleActionMock.mockReset();
  leaveHouseholdActionMock.mockReset();
  removeMemberActionMock.mockReset();
  transferOwnershipActionMock.mockReset();
});

const soleOwner: HouseholdMember = {
  id: "member-1",
  userId: "user-1",
  name: "Ada",
  email: "ada@example.com",
  role: "owner",
  joinedAt: new Date("2026-01-01T00:00:00Z"),
};

describe("MemberRowActions", () => {
  it("lets the sole owner reach the leave action and shows the last-member warning", async () => {
    render(
      <MemberRowActions
        member={soleOwner}
        currentUserId="user-1"
        viewerRole="owner"
        isLastMember={true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: t.casa.table.actions }));
    const leaveItem = await screen.findByText(t.casa.rowActions.leave);
    fireEvent.click(leaveItem);

    const warning = await screen.findByText(t.casa.leaveDialog.lastMemberDescription);
    expect(warning.textContent).toContain("As contas que você conectou continuam suas, sem casa");
  });

  it("hides every action for the owner when another member is still present", () => {
    render(
      <MemberRowActions
        member={soleOwner}
        currentUserId="user-1"
        viewerRole="owner"
        isLastMember={false}
      />,
    );

    expect(screen.queryByRole("button", { name: t.casa.table.actions })).toBeNull();
  });
});
