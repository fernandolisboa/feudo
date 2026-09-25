import { describe, expect, it } from "vitest";

import { AUTH_ATTEMPT_WINDOW_MS } from "./service";
import { t } from "./strings";

describe("rate-limited message", () => {
  it("tells the member how long the provider-authentication window lasts", () => {
    expect(t.errors.rateLimited).toContain(`${String(AUTH_ATTEMPT_WINDOW_MS / 60_000)} minutos`);
  });
});
