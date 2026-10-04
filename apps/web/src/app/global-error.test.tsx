// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Source_Serif_4: () => ({ variable: "font-serif-variable" }),
  Source_Sans_3: () => ({ variable: "font-sans-variable" }),
}));

import GlobalError from "./global-error";

describe("GlobalError", () => {
  it("shows the pt-BR last-resort page and retries on Tentar de novo", () => {
    const retry = vi.fn();
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
      render(<GlobalError retry={retry} />, { container: document });

      expect(screen.getByRole("heading", { name: "O Feudo não abriu" })).not.toBeNull();
      expect(screen.getByText(/Seus dados estão seguros/)).not.toBeNull();
      expect(document.documentElement.className).toContain("font-serif-variable");

      fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
      expect(retry).toHaveBeenCalledTimes(1);
    } finally {
      console.error = originalConsoleError;
    }
  });
});
