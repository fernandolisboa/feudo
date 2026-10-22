// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/auth", () => ({
  AuthShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  getCurrentSession: () => Promise.resolve({ user: { id: "user-1" } }),
  redirectIfAccountDeletionPending: () => Promise.resolve(),
  redirectIfTermsOutdated: () => undefined,
}));

vi.mock("@/modules/households", () => ({
  AcceptInvitationButton: () => null,
  getInvitationPreview: () =>
    Promise.resolve({ status: "ok", householdName: "Casa $& {role} $'", role: "member" }),
  t: {
    inviteAcceptPage: { title: "Invite", description: "Join {householdName} as {role}." },
    casa: { roles: { member: "member", admin: "admin", owner: "owner" } },
  },
}));

import InviteAcceptPage from "./page";

afterEach(() => {
  cleanup();
});

describe("InviteAcceptPage", () => {
  it("shows the household name verbatim, never expanding patterns or placeholders inside it", async () => {
    render(await InviteAcceptPage({ params: Promise.resolve({ id: "invitation-1" }) }));

    expect(screen.getByText("Join Casa $& {role} $' as member.")).not.toBeNull();
  });
});
