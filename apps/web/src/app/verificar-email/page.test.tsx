// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/auth", () => ({
  AuthShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ResendVerificationForm: () => null,
  sanitizeNextPath: (next: string | undefined) => next ?? "/",
  t: {
    verifyEmail: {
      title: "Confirm",
      body: "We sent a link to {email}.",
      bodyMissingEmail: "No email.",
      backToSignIn: "Back",
    },
  },
}));

import VerifyEmailPage from "./page";

afterEach(() => {
  cleanup();
});

describe("VerifyEmailPage", () => {
  it("shows the address from the link verbatim, replacement patterns included", async () => {
    render(
      await VerifyEmailPage({
        searchParams: Promise.resolve({ email: "a$&b$'c$`d@example.com" }),
      }),
    );

    expect(screen.getByText("We sent a link to a$&b$'c$`d@example.com.")).not.toBeNull();
  });
});
