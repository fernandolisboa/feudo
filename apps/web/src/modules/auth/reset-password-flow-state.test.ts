import { describe, expect, it } from "vitest";

import { resolveResetPasswordFlowState } from "./reset-password-flow-state";

describe("resolveResetPasswordFlowState", () => {
  it("shows the form when a token is present in the URL", () => {
    expect(resolveResetPasswordFlowState("a-token", false)).toBe("form");
    expect(resolveResetPasswordFlowState("a-token", true)).toBe("form");
  });

  it("reports the link as removed from the address bar when no token is present but the flow was already in progress on this browser", () => {
    expect(resolveResetPasswordFlowState(undefined, true)).toBe("link-removed");
  });

  it("reports the link as invalid when no token is present and no reset flow was ever in progress here", () => {
    expect(resolveResetPasswordFlowState(undefined, false)).toBe("invalid");
  });
});
