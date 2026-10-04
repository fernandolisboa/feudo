// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import AppLoading from "./loading";

afterEach(() => {
  cleanup();
});

describe("AppLoading", () => {
  it("renders skeleton bars, not a spinner or text", () => {
    const { container } = render(<AppLoading />);

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(container.textContent).toBe("");
  });
});
