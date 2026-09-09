import { describe, expect, it } from "vitest";

import { resolveAppRoute, resolveOnboardingRoute } from "./routing";

describe("resolveAppRoute", () => {
  it("sends a signed-out visitor to sign in", () => {
    expect(resolveAppRoute(null)).toBe("/entrar");
  });

  it("sends a signed-in user with no household to onboarding", () => {
    expect(resolveAppRoute({ householdId: null })).toBe("/comecar");
  });

  it("lets a signed-in user with an active household through", () => {
    expect(resolveAppRoute({ householdId: "household-a" })).toBeNull();
  });
});

describe("resolveOnboardingRoute", () => {
  it("sends a signed-out visitor to sign in", () => {
    expect(resolveOnboardingRoute(null)).toBe("/entrar");
  });

  it("sends a user who already has an active household to the overview", () => {
    expect(resolveOnboardingRoute({ householdId: "household-a" })).toBe("/");
  });

  it("lets a signed-in user with no household stay on onboarding", () => {
    expect(resolveOnboardingRoute({ householdId: null })).toBeNull();
  });
});
