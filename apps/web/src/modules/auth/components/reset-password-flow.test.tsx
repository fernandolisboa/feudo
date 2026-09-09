// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { t } from "../strings";
import { ResetPasswordFlow } from "./reset-password-flow";

vi.mock("./reset-password-form", () => ({
  ResetPasswordForm: () => null,
}));

const IN_PROGRESS_STORAGE_KEY = "feudo:reset-password-in-progress";

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

describe("ResetPasswordFlow", () => {
  it("keeps the in-progress flag set while the form stays mounted with a token", () => {
    render(<ResetPasswordFlow token="a-token" />);

    expect(window.sessionStorage.getItem(IN_PROGRESS_STORAGE_KEY)).toBe("true");
  });

  it("shows 'link removed from the address bar' on a fresh mount without a token, after a token was captured on this tab (simulating a reload)", () => {
    render(<ResetPasswordFlow token="a-token" />);

    render(<ResetPasswordFlow />);

    expect(screen.getByText(t.resetPassword.linkRemoved)).toBeDefined();
  });

  it("shows 'invalid or expired' on a further mount without a token, once the in-progress flag was cleared by rendering 'link removed'", () => {
    render(<ResetPasswordFlow token="a-token" />);
    render(<ResetPasswordFlow />);
    expect(screen.getByText(t.resetPassword.linkRemoved)).toBeDefined();

    render(<ResetPasswordFlow />);

    expect(screen.getByText(t.resetPassword.invalidOrExpired)).toBeDefined();
    expect(window.sessionStorage.getItem(IN_PROGRESS_STORAGE_KEY)).toBeNull();
  });

  it("shows 'invalid or expired' when reading sessionStorage throws (private browsing, disabled storage)", () => {
    const getItemSpy = vi.spyOn(window.sessionStorage, "getItem").mockImplementation(() => {
      throw new Error("storage disabled");
    });

    render(<ResetPasswordFlow />);

    expect(screen.getByText(t.resetPassword.invalidOrExpired)).toBeDefined();

    getItemSpy.mockRestore();
  });

  it("clears the in-progress flag once the reset flow is left after a token was captured (e.g. a successful submit navigating away)", () => {
    const { unmount } = render(<ResetPasswordFlow token="a-token" />);
    expect(window.sessionStorage.getItem(IN_PROGRESS_STORAGE_KEY)).toBe("true");

    unmount();

    expect(window.sessionStorage.getItem(IN_PROGRESS_STORAGE_KEY)).toBeNull();

    render(<ResetPasswordFlow />);
    expect(screen.getByText(t.resetPassword.invalidOrExpired)).toBeDefined();
  });
});
