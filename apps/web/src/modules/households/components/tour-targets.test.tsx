// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../actions", () => ({
  inviteMemberAction: vi.fn(),
  leaveHouseholdAction: vi.fn(),
  removeMemberAction: vi.fn(),
  resendInvitationAction: vi.fn(),
  cancelInvitationAction: vi.fn(),
  updateMemberRoleAction: vi.fn(),
  transferOwnershipAction: vi.fn(),
}));

import { TOURS } from "@/modules/shell/test/tours";

import { InviteMemberDialog } from "./invite-member-dialog";
import { MembersTable } from "./members-table";
import { PendingInvitationsTable } from "./pending-invitations-table";

afterEach(() => {
  cleanup();
});

describe("guided tour targets", () => {
  it.each([
    { name: "no pending invites", invitations: [] },
    {
      name: "a pending invite",
      invitations: [
        {
          id: "inv-1",
          email: "bia@example.com",
          role: "member" as const,
          expiresAt: new Date("2026-10-02T12:00:00Z"),
          deliveryFailedAt: null,
        },
      ],
    },
  ])("renders every target of the household tour for a manager, with $name", ({ invitations }) => {
    const { container } = render(
      <>
        <InviteMemberDialog />
        <MembersTable
          members={[
            {
              id: "member-1",
              userId: "user-1",
              name: "Ada",
              email: "ada@example.com",
              role: "owner",
              joinedAt: new Date("2026-09-01T12:00:00Z"),
            },
          ]}
          currentUserId="user-1"
          viewerRole="owner"
          timeZone="America/Sao_Paulo"
        />
        <PendingInvitationsTable invitations={invitations} timeZone="America/Sao_Paulo" />
      </>,
    );

    for (const step of TOURS.household.steps) {
      expect(container.querySelector(`[data-tour="${step.target}"]`), step.target).not.toBeNull();
    }
  });
});
